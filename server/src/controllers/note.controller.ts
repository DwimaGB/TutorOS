import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import { createNote, getNotesByLesson, deleteNote } from "../services/note.service.js"

export const createNoteHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, lessonId } = req.body
        const file = (req as any).file

        if (!file) {
            return res.status(400).json({ message: "File is required" })
        }

        const fileUrl = file.path ?? file.secure_url ?? file.url ?? file.location
        const publicId = file.filename ?? file.public_id ?? file.publicId ?? file.key

        if (!fileUrl || !publicId) {
            return res.status(400).json({ message: "Uploaded file missing URL or public id" })
        }

        if (!lessonId || typeof lessonId !== "string") {
            return res.status(400).json({ message: "Invalid lesson id" })
        }

        const note = await createNote({ title, description, lessonId, fileUrl, publicId })
        res.status(201).json(note)
    } catch (error: any) {
        if (error.message === "Lesson not found") {
            return res.status(404).json({ message: error.message })
        }
        res.status(500).json({ message: "Error uploading note" })
    }
}

export const getNotesByLessonHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { lessonId } = req.params
        if (typeof lessonId !== "string") {
            return res.status(400).json({ message: "Invalid lesson id" })
        }
        const notes = await getNotesByLesson(lessonId)
        res.json(notes)
    } catch (error) {
        res.status(500).json({ message: "Error fetching notes" })
    }
}

export const deleteNoteHandler = async (req: AuthRequest, res: Response) => {
    try {
        await deleteNote(req.params.noteId as string)
        res.json({ message: "Note deleted successfully" })
    } catch (error: any) {
        if (error.message === "Note not found") {
            return res.status(404).json({ message: error.message })
        }
        res.status(500).json({ message: "Error deleting note" })
    }
}
