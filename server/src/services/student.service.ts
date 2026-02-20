import User from "../models/user.model.js"
import Enrollment from "../models/enrollment.model.js"

export async function getAllStudents() {
    return await User.find({ role: "student" }).select("-password").sort({ createdAt: -1 })
}

export async function getStudentById(studentId: string) {
    const student = await User.findById(studentId).select("-password")
    if (!student || student.role !== "student") return null

    const enrollments = await Enrollment.find({ user: studentId }).populate("batch", "title description")

    return { student, enrollments }
}

export async function removeStudentFromBatch(studentId: string, batchId: string) {
    const deleted = await Enrollment.findOneAndDelete({ user: studentId, batch: batchId })
    if (!deleted) throw new Error("Enrollment not found")
    return deleted
}
