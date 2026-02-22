import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import {
    getOverviewStats,
    getBatchAnalytics,
    getStudentAnalytics,
    getRecentActivity,
    getSingleBatchAnalytics,
} from "../services/analytics.service.js"

export const getOverviewHandler = async (_req: AuthRequest, res: Response) => {
    try {
        const stats = await getOverviewStats()
        res.json(stats)
    } catch (error) {
        console.error("Analytics overview error:", error)
        res.status(500).json({ message: "Error fetching overview analytics" })
    }
}

export const getBatchAnalyticsHandler = async (
    _req: AuthRequest,
    res: Response
) => {
    try {
        const analytics = await getBatchAnalytics()
        res.json(analytics)
    } catch (error) {
        console.error("Batch analytics error:", error)
        res.status(500).json({ message: "Error fetching batch analytics" })
    }
}

export const getStudentAnalyticsHandler = async (
    _req: AuthRequest,
    res: Response
) => {
    try {
        const analytics = await getStudentAnalytics()
        res.json(analytics)
    } catch (error) {
        console.error("Student analytics error:", error)
        res.status(500).json({ message: "Error fetching student analytics" })
    }
}

export const getRecentActivityHandler = async (
    _req: AuthRequest,
    res: Response
) => {
    try {
        const activity = await getRecentActivity()
        res.json(activity)
    } catch (error) {
        console.error("Recent activity error:", error)
        res.status(500).json({ message: "Error fetching recent activity" })
    }
}

export const getSingleBatchAnalyticsHandler = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const data = await getSingleBatchAnalytics(req.params.batchId as string)
        if (!data) {
            return res.status(404).json({ message: "Batch not found" })
        }
        res.json(data)
    } catch (error) {
        console.error("Single batch analytics error:", error)
        res
            .status(500)
            .json({ message: "Error fetching batch analytics details" })
    }
}
