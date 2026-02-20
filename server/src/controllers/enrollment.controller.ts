import type { Response } from "express"
import { enrollStudent, getMyBatches } from "../services/enrollment.service.js"
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
    res.status(500).json({ message: "Error fetching enrolled batches" })
  }
}
