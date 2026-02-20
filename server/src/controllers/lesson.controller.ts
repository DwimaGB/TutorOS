import type { Response } from "express"
import { createLesson, getLessons, updateLesson, deleteLesson } from "../services/lesson.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, courseId } = req.body
    const file = (req as any).file

    if (!file) {
      return res.status(400).json({ message: "Video required" })
    }

    const videoUrl = file.path ?? file.secure_url ?? file.url ?? file.location
    const publicId = file.filename ?? file.public_id ?? file.publicId ?? file.key

    if (!videoUrl || !publicId) {
      return res.status(400).json({ message: "Uploaded file missing URL or public id" })
    }

    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({ message: "Invalid course id" })
    }

    const lesson = await createLesson({ title, description, courseId, videoUrl, publicId })
    res.status(201).json(lesson)
  } catch (error: any) {
    if (error.message === "Course not found") {
      return res.status(404).json({ message: error.message })
    }
    res.status(500).json({ message: "Server error" })
  }
}

export const getLessonsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params
    if (typeof courseId !== "string") {
      return res.status(400).json({ message: "Invalid course id" })
    }

    const lessons = await getLessons(courseId, req.user._id.toString(), req.user.role)
    res.json(lessons)
  } catch (error: any) {
    if (error.message === "Course not found") return res.status(404).json({ message: error.message })
    if (error.message === "Access denied. Please enroll in this course.") return res.status(403).json({ message: error.message })

    res.status(500).json({ message: "Error fetching lessons" })
  }
}

export const updateLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    const { title, description } = req.body

    const updated = await updateLesson(lessonId as string, { title, description })
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
