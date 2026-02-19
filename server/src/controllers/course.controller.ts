import type { Response } from "express"
import Course from "../models/course.model.js"
import Lesson from "../models/lesson.model.js"
import Enrollment from "../models/enrollment.model.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file as any   // get uploaded file
    const thumbnail = file?.path   // Cloudinary URL
    const publicId = file?.filename // Cloudinary public id

    const course = await Course.create({
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

export const getCourses = async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find().populate("instructor", "name")
    res.json(courses)
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses" })
  }
}

export const getCourseById = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: "Error fetching course" })
  }
}

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, price } = req.body

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    if (typeof title === "string" && title.trim()) {
      course.title = title
    }
    if (typeof description === "string" && description.trim()) {
      course.description = description
    }
    if (typeof price !== "undefined" && price !== null && !Number.isNaN(Number(price))) {
      course.price = Number(price)
    }

    const updated = await course.save()
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: "Error updating course" })
  }
}

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const course = await Course.findByIdAndDelete(id)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    await Lesson.deleteMany({ course: course._id })
    await Enrollment.deleteMany({ course: course._id })

    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting course" })
  }
}
