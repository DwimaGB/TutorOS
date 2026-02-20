import type { Response } from "express"
import { createLesson, getLessonsBySection, updateLesson, deleteLesson } from "../services/lesson.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, sectionId, order, duration } = req.body
    const file = (req as any).file

    if (!file) {
      return res.status(400).json({ message: "Video required" })
    }

    const videoUrl = file.path ?? file.secure_url ?? file.url ?? file.location
    const publicId = file.filename ?? file.public_id ?? file.publicId ?? file.key

    if (!videoUrl || !publicId) {
      return res.status(400).json({ message: "Uploaded file missing URL or public id" })
    }

    if (!sectionId || typeof sectionId !== "string") {
      return res.status(400).json({ message: "Invalid section id" })
    }

    const lesson = await createLesson({
      title,
      description,
      sectionId,
      videoUrl,
      publicId,
      order: order ? Number(order) : 0,
      duration: duration ? Number(duration) : 0,
    })

    res.status(201).json(lesson)
  } catch (error: any) {
    if (error.message === "Section not found") {
      return res.status(404).json({ message: error.message })
    }
    res.status(500).json({ message: "Server error" })
  }
}

export const getLessonsBySectionHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params
    if (typeof sectionId !== "string") {
      return res.status(400).json({ message: "Invalid section id" })
    }
    const lessons = await getLessonsBySection(sectionId)
    res.json(lessons)
  } catch (error) {
    res.status(500).json({ message: "Error fetching lessons" })
  }
}

export const updateLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    const { title, description, order, duration } = req.body

    const updated = await updateLesson(lessonId as string, { title, description, order, duration })
    res.json(updated)
  } catch (error: any) {
    if (error.message === "Lesson not found") return res.status(404).json({ message: error.message })
    res.status(500).json({ message: "Error updating lesson" })
  }
}

export const deleteLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    await deleteLesson(lessonId as string)
    res.json({ message: "Lesson deleted successfully" })
  } catch (error: any) {
    if (error.message === "Lesson not found") return res.status(404).json({ message: error.message })
    res.status(500).json({ message: "Error deleting lesson" })
  }
}
