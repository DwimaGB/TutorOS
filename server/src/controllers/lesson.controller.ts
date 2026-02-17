import type { Request, Response } from "express"
import mongoose from "mongoose"
import Lesson from "../models/lesson.model.js"

export const createLesson = async (req: Request, res: Response) => {
  const lesson = await Lesson.create(req.body)
  res.json(lesson)
}

export const getLessons = async (req: Request, res: Response) => {
  const courseIdParam = req.params.courseId
  if (typeof courseIdParam !== 'string') {
    return res.status(400).json({ message: "Invalid course ID" })
  }
  const courseId = new mongoose.Types.ObjectId(courseIdParam)
  const lessons = await Lesson.find({ course: courseId })
  res.json(lessons)
}