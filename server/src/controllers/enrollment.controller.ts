import type { Response } from "express"
import mongoose from "mongoose"
import Enrollment from "../models/enrollment.model.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const enrollCourse = async (req: AuthRequest, res: Response) => {
  const courseIdParam = req.params.courseId
  if (typeof courseIdParam !== 'string') {
    return res.status(400).json({ message: "Invalid course ID" })
  }
  const courseId = new mongoose.Types.ObjectId(courseIdParam)
  const enrollment = await Enrollment.create({
    user: req.user._id,
    course: courseId,
  })

  res.json(enrollment)
}

export const myCourses = async (req: AuthRequest, res: Response) => {
  const courses = await Enrollment.find({ user: req.user._id }).populate(
    "course"
  )

  res.json(courses)
}