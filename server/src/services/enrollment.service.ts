import mongoose from "mongoose"
import Enrollment from "../models/enrollment.model.js"
import Batch from "../models/batch.model.js"

export async function enrollStudent(batchIdStr: string, userIdStr: string, userRole: string) {
    if (userRole === "admin") {
        throw new Error("Admins cannot enroll in batches")
    }

    const batchId = new mongoose.Types.ObjectId(batchIdStr)
    const userId = new mongoose.Types.ObjectId(userIdStr)

    const batch = await Batch.findById(batchId)
    if (!batch) {
        throw new Error("Batch not found")
    }

    if (batch.instructor?.toString() === userId.toString()) {
        throw new Error("Instructors cannot enroll in their own batches")
    }

    const existing = await Enrollment.findOne({ user: userId, batch: batchId })
    if (existing) {
        if (existing.status === "rejected") {
            throw new Error("Your enrollment request was rejected. Please contact the admin.")
        }
        if (existing.status === "pending") {
            throw new Error("Your enrollment request is already pending approval.")
        }
        throw new Error("Already enrolled in this batch")
    }

    // Create enrollment with pending status (admin must approve)
    return await Enrollment.create({ user: userId, batch: batchId, status: "pending" })
}

export async function getMyBatches(userIdStr: string) {
    return await Enrollment.find({ user: userIdStr }).populate("batch")
}

export async function isEnrolledInBatch(userIdStr: string, batchIdStr: string) {
    const userId = new mongoose.Types.ObjectId(userIdStr)
    const batchId = new mongoose.Types.ObjectId(batchIdStr)
    // Only approved enrollments grant access
    const existing = await Enrollment.findOne({ user: userId, batch: batchId, status: "approved" }).select("_id")
    return !!existing
}

export async function getPendingEnrollments() {
    return await Enrollment.find({ status: "pending" })
        .populate("user", "name email")
        .populate("batch", "title description")
        .sort({ createdAt: -1 })
}

export async function approveEnrollment(enrollmentId: string) {
    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) throw new Error("Enrollment not found")
    if (enrollment.status !== "pending") throw new Error("Enrollment is not pending")
    enrollment.status = "approved"
    return await enrollment.save()
}

export async function rejectEnrollment(enrollmentId: string) {
    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) throw new Error("Enrollment not found")
    if (enrollment.status !== "pending") throw new Error("Enrollment is not pending")
    enrollment.status = "rejected"
    return await enrollment.save()
}
