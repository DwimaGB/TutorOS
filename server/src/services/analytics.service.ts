import Batch from "../models/batch.model.js"
import Section from "../models/section.model.js"
import Lesson from "../models/lesson.model.js"
import Enrollment from "../models/enrollment.model.js"
import Note from "../models/note.model.js"
import User from "../models/user.model.js"

/**
 * Overview stats: totals + quick metrics for the admin dashboard
 */
export const getOverviewStats = async () => {
    const [
        totalStudents,
        totalBatches,
        totalEnrollments,
        totalLessons,
        totalSections,
        totalNotes,
        pendingEnrollments,
        approvedEnrollments,
        rejectedEnrollments,
    ] = await Promise.all([
        User.countDocuments({ role: "student" }),
        Batch.countDocuments(),
        Enrollment.countDocuments(),
        Lesson.countDocuments(),
        Section.countDocuments(),
        Note.countDocuments(),
        Enrollment.countDocuments({ status: "pending" }),
        Enrollment.countDocuments({ status: "approved" }),
        Enrollment.countDocuments({ status: "rejected" }),
    ])

    return {
        totalStudents,
        totalBatches,
        totalEnrollments,
        totalLessons,
        totalSections,
        totalNotes,
        pendingEnrollments,
        approvedEnrollments,
        rejectedEnrollments,
    }
}

/**
 * Per-batch analytics: enrollment counts, sections, lessons, notes, total
 * content duration for every batch.
 */
export const getBatchAnalytics = async () => {
    const batches = await Batch.find().lean()

    const analytics = await Promise.all(
        batches.map(async (batch) => {
            const sections = await Section.find({ batch: batch._id }).lean()
            const sectionIds = sections.map((s) => s._id)

            const [enrollmentCount, approvedCount, pendingCount, lessons, noteCount] =
                await Promise.all([
                    Enrollment.countDocuments({ batch: batch._id }),
                    Enrollment.countDocuments({ batch: batch._id, status: "approved" }),
                    Enrollment.countDocuments({ batch: batch._id, status: "pending" }),
                    Lesson.find({ section: { $in: sectionIds } }).lean(),
                    Note.countDocuments({ lesson: { $in: await Lesson.find({ section: { $in: sectionIds } }).distinct("_id") } }),
                ])

            const totalDuration = lessons.reduce(
                (sum: number, l: any) => sum + (l.duration || 0),
                0
            )

            return {
                _id: batch._id,
                title: (batch as any).title,
                thumbnail: (batch as any).thumbnail,
                enrollmentCount,
                approvedCount,
                pendingCount,
                totalSections: sections.length,
                totalLessons: lessons.length,
                totalNotes: noteCount,
                totalDuration, // seconds
                createdAt: (batch as any).createdAt,
            }
        })
    )

    return analytics
}

/**
 * Student analytics: total students, average enrollments per student,
 * top students by enrollment count.
 */
export const getStudentAnalytics = async () => {
    const totalStudents = await User.countDocuments({ role: "student" })

    const enrollmentsPerStudent = await Enrollment.aggregate([
        {
            $group: {
                _id: "$user",
                count: { $sum: 1 },
            },
        },
    ])

    const avgEnrollments =
        enrollmentsPerStudent.length > 0
            ? +(
                enrollmentsPerStudent.reduce((sum, e) => sum + e.count, 0) /
                enrollmentsPerStudent.length
            ).toFixed(1)
            : 0

    // Top 10 students by enrollment count
    const topStudents = await Enrollment.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$user", enrollmentCount: { $sum: 1 } } },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                _id: 1,
                enrollmentCount: 1,
                "user.name": 1,
                "user.email": 1,
            },
        },
    ])

    return { totalStudents, avgEnrollments, topStudents }
}

/**
 * Recent enrollment activity — last 15 enrollment events across all batches,
 * populated with user + batch info.
 */
export const getRecentActivity = async (limit = 15) => {
    return Enrollment.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("user", "name email")
        .populate("batch", "title")
        .lean()
}

/**
 * Detailed analytics for a single batch.
 */
export const getSingleBatchAnalytics = async (batchId: string) => {
    const batch = await Batch.findById(batchId).lean()
    if (!batch) return null

    const sections = await Section.find({ batch: batchId })
        .sort({ order: 1 })
        .lean()
    const sectionIds = sections.map((s) => s._id)

    const lessons = await Lesson.find({ section: { $in: sectionIds } })
        .sort({ order: 1 })
        .lean()

    const enrollments = await Enrollment.find({ batch: batchId })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean()

    const noteCount = await Note.countDocuments({
        lesson: {
            $in: lessons.map((l) => l._id),
        },
    })

    const totalDuration = lessons.reduce(
        (sum: number, l: any) => sum + (l.duration || 0),
        0
    )

    // Per-section breakdown
    const sectionBreakdown = await Promise.all(
        sections.map(async (section) => {
            const sectionLessons = lessons.filter(
                (l: any) => l.section.toString() === section._id.toString()
            )
            const sectionDuration = sectionLessons.reduce(
                (sum: number, l: any) => sum + (l.duration || 0),
                0
            )
            return {
                _id: section._id,
                title: (section as any).title,
                order: (section as any).order,
                lessonCount: sectionLessons.length,
                totalDuration: sectionDuration,
            }
        })
    )

    return {
        batch,
        totalSections: sections.length,
        totalLessons: lessons.length,
        totalNotes: noteCount,
        totalDuration,
        enrollments,
        approvedCount: enrollments.filter((e: any) => e.status === "approved")
            .length,
        pendingCount: enrollments.filter((e: any) => e.status === "pending").length,
        rejectedCount: enrollments.filter((e: any) => e.status === "rejected")
            .length,
        sectionBreakdown,
    }
}
