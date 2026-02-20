import type { Response } from "express"
import { enrollStudent, getMyCourses } from "../services/enrollment.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const enrollCourse = async (req: AuthRequest, res: Response) => {
  try {
    const courseIdParam = req.params.courseId
    if (typeof courseIdParam !== "string") {
      return res.status(400).json({ message: "Invalid course ID" })
    }

    const enrollment = await enrollStudent(
      courseIdParam,
      req.user._id.toString(),
      req.user.role
    )

    res.status(201).json(enrollment)
  } catch (error: any) {
    if (error.message === "Course not found") {
      return res.status(404).json({ message: error.message })
    }
    return res.status(400).json({ message: error.message || "Error enrolling in course" })
  }
}

export const myCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await getMyCourses(req.user._id.toString())
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: "Error fetching enrolled courses" })
  }
}
