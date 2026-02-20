import mongoose from "mongoose"
import Lesson from "../models/lesson.model.js"
import Note from "../models/note.model.js"
import Section from "../models/section.model.js"

export async function createLesson(data: {
    title: string
    description: string
    sectionId: string
    videoUrl: string
    publicId: string
    order?: number
    duration?: number
}) {
    const sectionObjId = new mongoose.Types.ObjectId(data.sectionId)
    const section = await Section.findById(sectionObjId)
    if (!section) throw new Error("Section not found")

    // Auto-assign order if not provided
    let order = data.order
    if (typeof order !== "number") {
        const count = await Lesson.countDocuments({ section: sectionObjId })
        order = count
    }

    return await Lesson.create({
        title: data.title,
        description: data.description,
        section: sectionObjId,
        videoUrl: data.videoUrl,
        publicId: data.publicId,
        order,
        duration: data.duration || 0,
    })
}

export async function getLessonsBySection(sectionId: string) {
    return await Lesson.find({ section: sectionId }).sort({ order: 1 })
}

export async function updateLesson(lessonId: string, updates: {
    title?: string
    description?: string
    order?: number
    duration?: number
}) {
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) throw new Error("Lesson not found")

    if (typeof updates.title === "string" && updates.title.trim()) {
        lesson.title = updates.title
    }
    if (typeof updates.description === "string") {
        lesson.description = updates.description
    }
    if (typeof updates.order === "number") {
        lesson.order = updates.order
    }
    if (typeof updates.duration === "number") {
        lesson.duration = updates.duration
    }

    return await lesson.save()
}

export async function deleteLesson(lessonId: string) {
    const deleted = await Lesson.findByIdAndDelete(lessonId)
    if (!deleted) throw new Error("Lesson not found")

    // Cascade: delete notes attached to this lesson
    await Note.deleteMany({ lesson: deleted._id })

    return deleted
}
