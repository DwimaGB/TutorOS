import type { Response } from "express"
import {
  enrollStudent,
  getMyBatches,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
} from "../services/enrollment.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const enrollBatch = async (req: AuthRequest, res: Response) => {
  try {
    const batchIdParam = req.params.batchId
    if (typeof batchIdParam !== "string") {
      return res.status(400).json({ message: "Invalid batch ID" })
    }

    const enrollment = await enrollStudent(
      batchIdParam,
      req.user._id.toString(),
      req.user.role
    )

    res.status(201).json(enrollment)
  } catch (error: any) {
    console.error("Error enrolling in batch", error)
    if (error.message === "Batch not found") {
      return res.status(404).json({ message: error.message })
    }
    return res.status(400).json({ message: error.message || "Error enrolling in batch" })
  }
}

export const myBatches = async (req: AuthRequest, res: Response) => {
  try {
    const batches = await getMyBatches(req.user._id.toString())
    res.json(batches)
  } catch (error) {
    console.error("Error fetching enrolled batches", error)
    res.status(500).json({ message: "Error fetching enrolled batches" })
  }
}

export const getPendingHandler = async (_req: AuthRequest, res: Response) => {
  try {
    const pending = await getPendingEnrollments()
    res.json(pending)
  } catch (error) {
    console.error("Error fetching pending enrollments", error)
    res.status(500).json({ message: "Error fetching pending enrollments" })
  }
}

export const approveHandler = async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await approveEnrollment(req.params.enrollmentId as string)
    res.json(enrollment)
  } catch (error: any) {
    console.error("Error approving enrollment", error)
    if (error.message === "Enrollment not found") {
      return res.status(404).json({ message: error.message })
    }
    res.status(400).json({ message: error.message || "Error approving enrollment" })
  }
}

export const rejectHandler = async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await rejectEnrollment(req.params.enrollmentId as string)
    res.json(enrollment)
  } catch (error: any) {
    console.error("Error rejecting enrollment", error)
    if (error.message === "Enrollment not found") {
      return res.status(404).json({ message: error.message })
    }
    res.status(400).json({ message: error.message || "Error rejecting enrollment" })
  }
}
