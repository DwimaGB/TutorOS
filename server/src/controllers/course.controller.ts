import type { Response } from "express"
import Course from "../models/course.model.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createCourse = async (req: AuthRequest, res: Response) => {
  const course = await Course.create({
    ...req.body,
    instructor: req.user._id,
  })

  res.json(course)
}

export const getCourses = async (_req: AuthRequest, res: Response) => {
  const courses = await Course.find().populate("instructor", "name")
  res.json(courses)
}

export const getCourseById = async (req: AuthRequest, res: Response) => {
  const course = await Course.findById(req.params.id)
  res.json(course)
}