import type { Response } from "express"
import mongoose from "mongoose"
import Enrollment from "../models/enrollment.model.js"
import Course from "../models/course.model.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const enrollCourse = async (req: AuthRequest, res: Response) => {
  const courseIdParam = req.params.courseId
  if (typeof courseIdParam !== "string") {
    return res.status(400).json({ message: "Invalid course ID" })
  }

  // Prevent admins from enrolling in courses
  if (req.user.role === "admin") {
    return res.status(403).json({ message: "Admins cannot enroll in courses" })
  }

  const courseId = new mongoose.Types.ObjectId(courseIdParam)

  // Ensure course exists
  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ message: "Course not found" })
  }

  // Prevent instructors from enrolling in their own course
  if (course.instructor?.toString() === req.user._id.toString()) {
    return res
      .status(400)
      .json({ message: "Instructors cannot enroll in their own courses" })
  }

  // Prevent duplicate enrollments
  const existing = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
  })

  if (existing) {
    return res
      .status(400)
      .json({ message: "You are already enrolled in this course" })
  }

  const enrollment = await Enrollment.create({
    user: req.user._id,
    course: courseId,
  })

  res.status(201).json(enrollment)
}

export const myCourses = async (req: AuthRequest, res: Response) => {
  const courses = await Enrollment.find({ user: req.user._id }).populate(
    "course"
  )

  res.json(courses)
}