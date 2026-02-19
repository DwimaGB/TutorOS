import type { Request, Response } from "express"
import mongoose from "mongoose"
import Lesson from "../models/lesson.model.js"
import Enrollment from "../models/enrollment.model.js"
import Course from "../models/course.model.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, courseId } = req.body

    const file = (req as any).file

    if (!file) {
      return res.status(400).json({ message: "Video required" })
    }

    // tolerant extraction: different upload middlewares/cloudinary wrappers
    const videoUrl = file.path ?? file.secure_url ?? file.url ?? file.location
    const publicId = file.filename ?? file.public_id ?? file.publicId ?? file.key

    if (!videoUrl || !publicId) {
      return res.status(400).json({ message: "Uploaded file missing URL or public id" })
    }

    // validate course exists
    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({ message: "Invalid course id" })
    }

    const courseObjId = new mongoose.Types.ObjectId(courseId)
    const course = await Course.findById(courseObjId)
    if (!course) return res.status(404).json({ message: "Course not found" })

    const lesson = await Lesson.create({
      title,
      description,
      course: courseObjId,
      videoUrl,
      publicId,
    })

    res.status(201).json(lesson)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}


export const getLessons = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params
    if (typeof courseId !== "string") {
      return res.status(400).json({ message: "Invalid course id" })
    }

    const userId = req.user._id

    // normalize ids to ObjectId for queries
    const courseObjId = new mongoose.Types.ObjectId(courseId)

    // check course exists
    const course = await Course.findById(courseObjId)

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // allow admin directly
    if (req.user.role === "admin") {
      const lessons = await Lesson.find({ course: courseObjId })
      return res.json(lessons)
    }

    // check enrollment
    const enrollment = await Enrollment.findOne({
      user: new mongoose.Types.ObjectId(userId.toString()),
      course: courseObjId,
    })

    if (!enrollment) {
      return res.status(403).json({
        message: "Access denied. Please enroll in this course.",
      })
    }

    // fetch lessons
    const lessons = await Lesson.find({ course: courseObjId })

    res.json(lessons)
  } catch (error) {
    res.status(500).json({ message: "Error fetching lessons" })
  }
}

export const updateLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params
    const { title, description } = req.body

    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    if (typeof title === "string" && title.trim()) {
      lesson.title = title
    }
    if (typeof description === "string") {
      lesson.description = description
    }

    const updated = await lesson.save()
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: "Error updating lesson" })
  }
}

export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params

    const deleted = await Lesson.findByIdAndDelete(lessonId)
    if (!deleted) {
      return res.status(404).json({ message: "Lesson not found" })
    }

    res.json({ message: "Lesson deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting lesson" })
  }
}
