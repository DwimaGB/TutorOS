import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import {
    createSection,
    getSectionsByBatch,
    updateSection,
    deleteSection,
} from "../services/section.service.js"

export const createSectionHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId, title, order } = req.body
        if (!batchId || typeof batchId !== "string") {
            return res.status(400).json({ message: "Invalid batch id" })
        }
        const section = await createSection(batchId, title, order)
        res.status(201).json(section)
    } catch (error: any) {
        if (error.message === "Batch not found") return res.status(404).json({ message: error.message })
        res.status(500).json({ message: "Error creating section" })
    }
}

export const getSectionsByBatchHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params
        if (typeof batchId !== "string") {
            return res.status(400).json({ message: "Invalid batch id" })
        }
        const sections = await getSectionsByBatch(batchId)
        res.json(sections)
    } catch (error) {
        res.status(500).json({ message: "Error fetching sections" })
    }
}

export const updateSectionHandler = async (req: AuthRequest, res: Response) => {
    try {
        const updated = await updateSection(req.params.sectionId as string, req.body)
        res.json(updated)
    } catch (error: any) {
        if (error.message === "Section not found") return res.status(404).json({ message: error.message })
        res.status(500).json({ message: "Error updating section" })
    }
}

export const deleteSectionHandler = async (req: AuthRequest, res: Response) => {
    try {
        await deleteSection(req.params.sectionId as string)
        res.json({ message: "Section deleted successfully" })
    } catch (error: any) {
        if (error.message === "Section not found") return res.status(404).json({ message: error.message })
        res.status(500).json({ message: "Error deleting section" })
    }
}
