import type { Response } from "express"
import { createBatch, getBatches, getBatchById, updateBatch, deleteBatch } from "../services/batch.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"

export const createBatchHandler = async (req: AuthRequest, res: Response) => {
    try {
        const file = req.file as any
        const thumbnail = file?.path
        const publicId = file?.filename

        const batch = await createBatch({
            title: req.body.title,
            description: req.body.description,
            thumbnail,
            publicId,
            instructor: req.user._id,
        })

        res.json(batch)
    } catch (error) {
        res.status(500).json({ message: "Error creating batch" })
    }
}

export const getBatchesHandler = async (_req: AuthRequest, res: Response) => {
    try {
        const batches = await getBatches()
        res.json(batches)
    } catch (error) {
        res.status(500).json({ message: "Error fetching batches" })
    }
}

export const getBatchByIdHandler = async (req: AuthRequest, res: Response) => {
    try {
        const batch = await getBatchById(req.params.id as string)
        if (!batch) {
            return res.status(404).json({ message: "Batch not found" })
        }
        res.json(batch)
    } catch (error) {
        res.status(500).json({ message: "Error fetching batch" })
    }
}

export const updateBatchHandler = async (req: AuthRequest, res: Response) => {
    try {
        const updated = await updateBatch(req.params.id as string, req.body)
        if (!updated) {
            return res.status(404).json({ message: "Batch not found" })
        }
        res.json(updated)
    } catch (error) {
        res.status(500).json({ message: "Error updating batch" })
    }
}

export const deleteBatchHandler = async (req: AuthRequest, res: Response) => {
    try {
        const deleted = await deleteBatch(req.params.id as string)
        if (!deleted) {
            return res.status(404).json({ message: "Batch not found" })
        }
        res.json({ message: "Batch deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Error deleting batch" })
    }
}
