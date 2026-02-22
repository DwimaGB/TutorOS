import User from "../models/user.model.js"
import Enrollment from "../models/enrollment.model.js"
import mongoose from "mongoose"

export async function getAllStudents() {
    const students = await User.find({ role: "student" }).select("-password").sort({ createdAt: -1 }).lean()

    // Get approved enrollment counts for all students in one query
    const enrollmentCounts = await Enrollment.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
    ])

    const countMap = new Map(enrollmentCounts.map((e: { _id: mongoose.Types.ObjectId; count: number }) => [e._id.toString(), e.count]))

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    return students.map((student) => ({
        ...student,
        approvedEnrollments: countMap.get(student._id.toString()) || 0,
        isOnline: student.lastSeen ? new Date(student.lastSeen) > fiveMinutesAgo : false,
        lastSeen: student.lastSeen,
    }))
}

export async function getStudentById(studentId: string) {
    const student = await User.findById(studentId).select("-password")
    if (!student || student.role !== "student") return null

    const enrollments = await Enrollment.find({ user: studentId }).populate("batch", "title description")

    return { student, enrollments }
}

export async function removeStudentFromBatch(studentId: string, batchId: string) {
    const deleted = await Enrollment.findOneAndDelete({ user: studentId, batch: batchId })
    if (!deleted) throw new Error("Enrollment not found")
    return deleted
}

/**
 * Admin directly enrolls a student in a batch with "approved" status.
 */
export async function adminEnrollStudent(studentId: string, batchId: string) {
    const userId = new mongoose.Types.ObjectId(studentId)
    const batchObjId = new mongoose.Types.ObjectId(batchId)

    const student = await User.findById(userId)
    if (!student || student.role !== "student") throw new Error("Student not found")

    const existing = await Enrollment.findOne({ user: userId, batch: batchObjId })
    if (existing) {
        if (existing.status === "approved") throw new Error("Student already enrolled")
        // If pending or rejected, upgrade to approved
        existing.status = "approved"
        return await existing.save()
    }

    return await Enrollment.create({ user: userId, batch: batchObjId, status: "approved" })
}

/**
 * Get students enrolled in a specific batch (with enrollment status).
 */
export async function getStudentsByBatch(batchId: string) {
    const enrollments = await Enrollment.find({ batch: batchId })
        .populate("user", "name email createdAt")
        .sort({ createdAt: -1 })

    return enrollments
        .filter((e) => e.user != null)
        .map((e) => ({
            enrollmentId: e._id,
            student: e.user,
            status: e.status,
            enrolledAt: e.createdAt,
        }))
}

