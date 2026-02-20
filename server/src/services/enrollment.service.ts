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
        throw new Error("Already enrolled in this batch")
    }

    return await Enrollment.create({ user: userId, batch: batchId })
}

export async function getMyBatches(userIdStr: string) {
    return await Enrollment.find({ user: userIdStr }).populate("batch")
}
