import mongoose from "mongoose"
import Note from "../models/note.model.js"
import Lesson from "../models/lesson.model.js"

export async function createNote(data: {
    title: string
    description?: string
    lessonId: string
    fileUrl: string
    publicId: string
}) {
    const lessonObjId = new mongoose.Types.ObjectId(data.lessonId)
    const lesson = await Lesson.findById(lessonObjId)
    if (!lesson) throw new Error("Lesson not found")

    return await Note.create({
        title: data.title,
        description: data.description ?? "",
        lesson: lessonObjId,
        fileUrl: data.fileUrl,
        publicId: data.publicId,
    })
}

export async function getNotesByLesson(lessonId: string) {
    return await Note.find({ lesson: lessonId }).sort({ createdAt: -1 })
}

export async function getNoteById(noteId: string) {
    return await Note.findById(noteId)
}

export async function deleteNote(noteId: string) {
    const deleted = await Note.findByIdAndDelete(noteId)
    if (!deleted) throw new Error("Note not found")
    return deleted
}
