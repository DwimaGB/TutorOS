import type { Response } from "express"
import { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } from "../services/course.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createCourseHandler = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file as any
    const thumbnail = file?.path
    const publicId = file?.filename

    const course = await createCourse({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      thumbnail,
      publicId,
      instructor: req.user._id,
    })

    res.json(course)
  } catch (error) {
    res.status(500).json({ message: "Error creating course" })
  }
}

export const getCoursesHandler = async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await getCourses()
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses" })
  }
}

export const getCourseByIdHandler = async (req: AuthRequest, res: Response) => {
  try {
    const course = await getCourseById(req.params.id as string)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: "Error fetching course" })
  }
}

export const updateCourseHandler = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await updateCourse(req.params.id as string, req.body)
    if (!updated) {
      return res.status(404).json({ message: "Course not found" })
    }
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: "Error updating course" })
  }
}

export const deleteCourseHandler = async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await deleteCourse(req.params.id as string)
    if (!deleted) {
      return res.status(404).json({ message: "Course not found" })
    }
    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting course" })
  }
}
