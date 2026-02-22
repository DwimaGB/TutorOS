import type { Response } from "express"
import {
  createLesson,
  createLiveLesson,
  getLessonsBySection,
  updateLesson,
  deleteLesson,
  uploadRecording,
} from "../services/lesson.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import Section from "../models/section.model.js"
import { isEnrolledInBatch } from "../services/enrollment.service.js"
import { notifyBatchStudents } from "../services/notification.service.js"
import Lesson from "../models/lesson.model.js"

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

    // Fire-and-forget notification
    notifyBatchStudents({
      sectionId,
      type: "lesson_uploaded",
      message: `New lesson uploaded: "${title}"`,
      lessonId: lesson._id.toString(),
    })

    res.status(201).json(lesson)
  } catch (error: any) {
    console.error("Error creating lesson", error)
    if (error.message === "Section not found") {
      return res.status(404).json({ message: error.message })
    }
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * Create a live-class lesson (no video file upload).
 */
export const createLiveLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, sectionId, livePlatform, liveJoinUrl, liveStartAt, order } = req.body

    if (!sectionId || typeof sectionId !== "string") {
      return res.status(400).json({ message: "Invalid section id" })
    }
    if (!liveJoinUrl || typeof liveJoinUrl !== "string") {
      return res.status(400).json({ message: "Live join URL is required" })
    }
    if (!liveStartAt) {
      return res.status(400).json({ message: "Live start time is required" })
    }

    const lessonData: Parameters<typeof createLiveLesson>[0] = {
      title,
      description,
      sectionId,
      livePlatform: livePlatform || "zoom",
      liveJoinUrl,
      liveStartAt,
    }

    if (typeof order === "number") {
      lessonData.order = order
    }

    const lesson = await createLiveLesson(lessonData)

    // Fire-and-forget notification
    notifyBatchStudents({
      sectionId,
      type: "live_scheduled",
      message: `Live class scheduled: "${title}"`,
      lessonId: lesson._id.toString(),
    })

    res.status(201).json(lesson)
  } catch (error: any) {
    console.error("Error creating live lesson", error)
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

    const section = await Section.findById(sectionId)
    if (!section) {
      return res.status(404).json({ message: "Section not found" })
    }

    if (req.user && req.user.role !== "admin") {
      const enrolled = await isEnrolledInBatch(req.user._id.toString(), section.batch.toString())
      if (!enrolled) {
        return res.status(403).json({ message: "Enroll in this batch to access content." })
      }
    }

    const lessons = await getLessonsBySection(sectionId)
    res.json(lessons)
  } catch (error) {
    console.error("Error fetching lessons", error)
    res.status(500).json({ message: "Error fetching lessons" })
  }
}

export const updateLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    const {
      title, description, order, duration,
      isLiveEnabled, livePlatform, liveJoinUrl, liveStartAt, liveStatus,
    } = req.body

    const updated = await updateLesson(lessonId as string, {
      title, description, order, duration,
      isLiveEnabled, livePlatform, liveJoinUrl, liveStartAt, liveStatus,
    })

    // Notify students when a live class goes live
    if (liveStatus === "live") {
      const lessonDoc = await Lesson.findById(lessonId)
      if (lessonDoc) {
        notifyBatchStudents({
          sectionId: lessonDoc.section.toString(),
          type: "live_started",
          message: `Live class started: "${updated.title}" — Join now!`,
          lessonId: updated._id.toString(),
        })
      }
    }

    res.json(updated)
  } catch (error: any) {
    console.error("Error updating lesson", error)
    if (error.message === "Lesson not found") return res.status(404).json({ message: error.message })
    res.status(500).json({ message: "Error updating lesson" })
  }
}

/**
 * Upload a recording to an existing live lesson.
 * Uses the same video upload middleware as regular lesson creation.
 */
export const uploadRecordingHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    const file = (req as any).file

    if (!file) {
      return res.status(400).json({ message: "Recording video file is required" })
    }

    const videoUrl = file.path ?? file.secure_url ?? file.url ?? file.location
    const publicId = file.filename ?? file.public_id ?? file.publicId ?? file.key
    const duration = req.body.duration ? Number(req.body.duration) : undefined

    if (!videoUrl || !publicId) {
      return res.status(400).json({ message: "Uploaded file missing URL or public id" })
    }

    const updated = await uploadRecording(lessonId as string, videoUrl, publicId, duration)

    // Notify students that a recording is now available
    notifyBatchStudents({
      sectionId: updated.section.toString(),
      type: "recording_uploaded",
      message: `Recording available: "${updated.title}"`,
      lessonId: updated._id.toString(),
    })

    res.json(updated)
  } catch (error: any) {
    console.error("Error uploading recording", error)
    if (error.message === "Lesson not found") return res.status(404).json({ message: error.message })
    res.status(500).json({ message: "Error uploading recording" })
  }
}

export const deleteLessonHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    await deleteLesson(lessonId as string)
    res.json({ message: "Lesson deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting lesson", error)
    if (error.message === "Lesson not found") return res.status(404).json({ message: error.message })
    res.status(500).json({ message: "Error deleting lesson" })
  }
}
