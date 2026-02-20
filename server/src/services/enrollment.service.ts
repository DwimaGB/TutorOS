import mongoose from "mongoose"
import Enrollment from "../models/enrollment.model.js"
import Course from "../models/course.model.js"

export async function enrollStudent(courseIdStr: string, userIdStr: string, userRole: string) {
    if (userRole === "admin") {
        throw new Error("Admins cannot enroll in courses")
    }

    const courseId = new mongoose.Types.ObjectId(courseIdStr)
    const userId = new mongoose.Types.ObjectId(userIdStr)

    const course = await Course.findById(courseId)
    if (!course) {
        throw new Error("Course not found")
    }

    if (course.instructor?.toString() === userId.toString()) {
        throw new Error("Instructors cannot enroll in their own courses")
    }

    const existing = await Enrollment.findOne({ user: userId, course: courseId })
    if (existing) {
        throw new Error("You are already enrolled in this course")
    }

    return await Enrollment.create({ user: userId, course: courseId })
}

export async function getMyCourses(userIdStr: string) {
    return await Enrollment.find({ user: userIdStr }).populate("course")
}
