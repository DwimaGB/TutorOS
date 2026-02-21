import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import { createNote, getNotesByLesson, deleteNote, getNoteById } from "../services/note.service.js"
import { supabase } from "../config/supabase.js"
import Lesson from "../models/lesson.model.js"
import Section from "../models/section.model.js"
import { isEnrolledInBatch } from "../services/enrollment.service.js"

export const createNoteHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, lessonId } = req.body
        const file = (req as any).file

        if (!file) {
            return res.status(400).json({ message: "File is required" })
        }

        if (!lessonId || typeof lessonId !== "string") {
            return res.status(400).json({ message: "Invalid lesson id" })
        }

        const baseName = file.originalname
            .replace(/\.[^/.]+$/, "")      // remove extension
            .replace(/[^a-zA-Z0-9_-]/g, "_") // sanitize
            .slice(0, 80)                  // limit length
        const uniqueName = `${Date.now()}-${baseName}.pdf`

        const { data, error } = await supabase.storage
            .from("notes")
            .upload(uniqueName, file.buffer, {
                contentType: file.mimetype || "application/pdf",
                upsert: false
            })

        if (error) {
            console.error("Supabase upload error:", error)
            return res.status(500).json({ message: "Error uploading file to storage" })
        }

        const publicId = data.path

        const { data: publicUrlData } = supabase.storage
            .from("notes")
            .getPublicUrl(publicId)

        const fileUrl = publicUrlData.publicUrl

        const note = await createNote({ title, description, lessonId, fileUrl, publicId })
        res.status(201).json(note)
    } catch (error: any) {
        console.error("Error uploading note", error)
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

        const lesson = await Lesson.findById(lessonId)
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" })
        }

        const section = await Section.findById(lesson.section)
        if (!section) {
            return res.status(404).json({ message: "Section not found" })
        }

        if (req.user && req.user.role !== "admin") {
            const enrolled = await isEnrolledInBatch(req.user._id.toString(), section.batch.toString())
            if (!enrolled) {
                return res.status(403).json({ message: "Enroll in this batch to access notes." })
            }
        }

        const notes = await getNotesByLesson(lessonId)
        res.json(notes)
    } catch (error) {
        console.error("Error fetching notes", error)
        res.status(500).json({ message: "Error fetching notes" })
    }
}

export const deleteNoteHandler = async (req: AuthRequest, res: Response) => {
    try {
        const deletedNote = await deleteNote(req.params.noteId as string)

        if (deletedNote?.publicId) {
            await supabase.storage.from("notes").remove([deletedNote.publicId])
        }

        res.json({ message: "Note deleted successfully" })
    } catch (error: any) {
        console.error("Error deleting note", error)
        if (error.message === "Note not found") {
            return res.status(404).json({ message: error.message })
        }
        res.status(500).json({ message: "Error deleting note" })
    }
}


export const downloadNoteHandler = async (req: AuthRequest, res: Response) => {
    try {
        const note = await getNoteById(req.params.noteId as string)

        if (!note) {
            return res.status(404).json({ message: "Note not found" })
        }

        if (!note.publicId) {
            return res.status(400).json({ message: "File not available" })
        }

        const lesson = await Lesson.findById(note.lesson)
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" })
        }

        const section = await Section.findById(lesson.section)
        if (!section) {
            return res.status(404).json({ message: "Section not found" })
        }

        if (req.user && req.user.role !== "admin") {
            const enrolled = await isEnrolledInBatch(req.user._id.toString(), section.batch.toString())
            if (!enrolled) {
                return res.status(403).json({ message: "Enroll in this batch to download notes." })
            }
        }

        // Signed URL works for both public & private buckets
        const { data, error } = await supabase.storage
            .from("notes")
            .createSignedUrl(note.publicId, 60, {
                download: `${note.title}.pdf`,
            })

        if (error) throw error

        res.redirect(data.signedUrl)

    } catch (error) {
        console.error("Download error:", error)
        res.status(500).json({ message: "Error downloading note" })
    }
}
