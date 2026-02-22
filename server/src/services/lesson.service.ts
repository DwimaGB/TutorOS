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

/**
 * Create a live-class lesson (no video upload required at creation time).
 */
export async function createLiveLesson(data: {
    title: string
    description?: string
    sectionId: string
    livePlatform: "zoom" | "youtube" | "other"
    liveJoinUrl: string
    liveStartAt: string | Date
    order?: number
}) {
    const sectionObjId = new mongoose.Types.ObjectId(data.sectionId)
    const section = await Section.findById(sectionObjId)
    if (!section) throw new Error("Section not found")

    let order = data.order
    if (typeof order !== "number") {
        const count = await Lesson.countDocuments({ section: sectionObjId })
        order = count
    }

    return await Lesson.create({
        title: data.title,
        description: data.description || "",
        section: sectionObjId,
        isLiveEnabled: true,
        livePlatform: data.livePlatform,
        liveJoinUrl: data.liveJoinUrl,
        liveStartAt: new Date(data.liveStartAt),
        liveStatus: "scheduled",
        order,
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
    isLiveEnabled?: boolean
    livePlatform?: "zoom" | "youtube" | "other"
    liveJoinUrl?: string
    liveStartAt?: string | Date
    liveStatus?: "scheduled" | "live" | "ended"
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

    // Live fields
    if (typeof updates.isLiveEnabled === "boolean") {
        lesson.isLiveEnabled = updates.isLiveEnabled
    }
    if (updates.livePlatform) {
        lesson.livePlatform = updates.livePlatform
    }
    if (typeof updates.liveJoinUrl === "string") {
        lesson.liveJoinUrl = updates.liveJoinUrl
    }
    if (updates.liveStartAt) {
        lesson.liveStartAt = new Date(updates.liveStartAt)
    }
    if (updates.liveStatus) {
        lesson.liveStatus = updates.liveStatus
    }

    return await lesson.save()
}

/**
 * Upload recording to an existing live lesson — sets videoUrl + publicId so the
 * lesson transitions from "live only" to "has recording".
 */
export async function uploadRecording(lessonId: string, videoUrl: string, publicId: string, duration?: number) {
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) throw new Error("Lesson not found")

    lesson.videoUrl = videoUrl
    lesson.publicId = publicId
    if (typeof duration === "number") {
        lesson.duration = duration
    }
    // Mark live as ended since recording is now available
    if (lesson.isLiveEnabled && lesson.liveStatus !== "ended") {
        lesson.liveStatus = "ended"
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
