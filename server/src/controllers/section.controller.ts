import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import {
    createSection,
    getSectionsByBatch,
    updateSection,
    deleteSection,
} from "../services/section.service.js"
import { isEnrolledInBatch } from "../services/enrollment.service.js"

export const createSectionHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId, title, order } = req.body
        if (!batchId || typeof batchId !== "string") {
            return res.status(400).json({ message: "Invalid batch id" })
        }
        const section = await createSection(batchId, title, order)
        res.status(201).json(section)
    } catch (error: any) {
        console.error("Error creating section", error)
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

        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" })
        }

        if (req.user.role !== "admin") {
            const enrolled = await isEnrolledInBatch(req.user._id.toString(), batchId)
            if (!enrolled) {
                return res.status(403).json({ message: "Enroll in this batch to access content." })
            }
        }

        const sections = await getSectionsByBatch(batchId)
        res.json(sections)
    } catch (error) {
        console.error("Error fetching sections", error)
        res.status(500).json({ message: "Error fetching sections" })
    }
}

export const updateSectionHandler = async (req: AuthRequest, res: Response) => {
    try {
        const updated = await updateSection(req.params.sectionId as string, req.body)
        res.json(updated)
    } catch (error: any) {
        console.error("Error updating section", error)
        if (error.message === "Section not found") return res.status(404).json({ message: error.message })
        res.status(500).json({ message: "Error updating section" })
    }
}

export const deleteSectionHandler = async (req: AuthRequest, res: Response) => {
    try {
        await deleteSection(req.params.sectionId as string)
        res.json({ message: "Section deleted successfully" })
    } catch (error: any) {
        console.error("Error deleting section", error)
        if (error.message === "Section not found") return res.status(404).json({ message: error.message })
        res.status(500).json({ message: "Error deleting section" })
    }
}
