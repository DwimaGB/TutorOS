import Course from "../models/course.model.js"
import Lesson from "../models/lesson.model.js"
import Enrollment from "../models/enrollment.model.js"

export async function createCourse(data: any) {
    return await Course.create(data)
}

export async function getCourses() {
    return await Course.find().populate("instructor", "name")
}

export async function getCourseById(id: string) {
    return await Course.findById(id)
}

export async function updateCourse(id: string, updates: any) {
    const course = await Course.findById(id)
    if (!course) return null

    if (typeof updates.title === "string" && updates.title.trim()) {
        course.title = updates.title
    }
    if (typeof updates.description === "string" && updates.description.trim()) {
        course.description = updates.description
    }
    if (typeof updates.price !== "undefined" && updates.price !== null && !Number.isNaN(Number(updates.price))) {
        course.price = Number(updates.price)
    }

    return await course.save()
}

export async function deleteCourse(id: string) {
    const course = await Course.findByIdAndDelete(id)
    if (!course) return null

    await Lesson.deleteMany({ course: course._id })
    await Enrollment.deleteMany({ course: course._id })

    return course
}
