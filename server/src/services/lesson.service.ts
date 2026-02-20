import mongoose from "mongoose"
import Lesson from "../models/lesson.model.js"
import Enrollment from "../models/enrollment.model.js"
import Course from "../models/course.model.js"

export async function createLesson(data: {
    title: string
    description: string
    courseId: string
    videoUrl: string
    publicId: string
}) {
    const courseObjId = new mongoose.Types.ObjectId(data.courseId)
    const course = await Course.findById(courseObjId)
    if (!course) throw new Error("Course not found")

    return await Lesson.create({
        title: data.title,
        description: data.description,
        course: courseObjId,
        videoUrl: data.videoUrl,
        publicId: data.publicId,
    })
}

export async function getLessons(courseId: string, userId: string, userRole: string) {
    const courseObjId = new mongoose.Types.ObjectId(courseId)
    const course = await Course.findById(courseObjId)
    if (!course) throw new Error("Course not found")

    if (userRole === "admin") {
        return await Lesson.find({ course: courseObjId })
    }

    const enrollment = await Enrollment.findOne({
        user: new mongoose.Types.ObjectId(userId),
        course: courseObjId,
    })

    if (!enrollment) {
        throw new Error("Access denied. Please enroll in this course.")
    }

    return await Lesson.find({ course: courseObjId })
}

export async function updateLesson(lessonId: string, updates: { title?: string; description?: string }) {
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) throw new Error("Lesson not found")

    if (typeof updates.title === "string" && updates.title.trim()) {
        lesson.title = updates.title
    }
    if (typeof updates.description === "string") {
        lesson.description = updates.description
    }

    return await lesson.save()
}

export async function deleteLesson(lessonId: string) {
    const deleted = await Lesson.findByIdAndDelete(lessonId)
    if (!deleted) throw new Error("Lesson not found")
    return deleted
}
