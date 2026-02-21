import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import {
    getNotificationsForUser,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from "../services/notification.service.js"
import Lesson from "../models/lesson.model.js"
import Section from "../models/section.model.js"
import Enrollment from "../models/enrollment.model.js"

export const getNotificationsHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString()
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const unreadOnly = req.query.unread === "true"
        const limit = req.query.limit ? Number(req.query.limit) : 30

        const notifications = await getNotificationsForUser(userId, limit, unreadOnly)
        const unreadCount = await getUnreadCount(userId)

        res.json({ notifications, unreadCount })
    } catch (error) {
        console.error("Error fetching notifications:", error)
        res.status(500).json({ message: "Error fetching notifications" })
    }
}

export const getUnreadCountHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString()
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const count = await getUnreadCount(userId)
        res.json({ count })
    } catch (error) {
        console.error("Error fetching unread count:", error)
        res.status(500).json({ message: "Error fetching unread count" })
    }
}

export const markAsReadHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString()
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const { notificationId } = req.params
        await markAsRead(notificationId as string, userId)
        res.json({ message: "Marked as read" })
    } catch (error) {
        console.error("Error marking notification as read:", error)
        res.status(500).json({ message: "Error marking as read" })
    }
}

export const markAllAsReadHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString()
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        await markAllAsRead(userId)
        res.json({ message: "All notifications marked as read" })
    } catch (error) {
        console.error("Error marking all as read:", error)
        res.status(500).json({ message: "Error marking all as read" })
    }
}

/**
 * Returns batch IDs that have at least one lesson with liveStatus === "live".
 * - Admin: returns ALL batches with active live lessons.
 * - Student: returns only enrolled batches with active live lessons.
 */
export const getLiveBatchesHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id?.toString()
        if (!userId) return res.status(401).json({ message: "Unauthorized" })

        const isAdmin = req.user?.role === "admin"

        let sectionFilter: any = {}

        if (!isAdmin) {
            // Student: limit to enrolled batches
            const enrollments = await Enrollment.find({
                user: userId,
                status: "approved",
            }).select("batch")

            const batchIds = enrollments.map((e) => e.batch)
            if (batchIds.length === 0) return res.json({ liveBatchIds: [] })

            sectionFilter = { batch: { $in: batchIds } }
        }

        // Find sections (all for admin, enrolled for student)
        const sections = await Section.find(sectionFilter).select("_id batch")
        const sectionIds = sections.map((s) => s._id)

        if (sectionIds.length === 0) return res.json({ liveBatchIds: [] })

        // Find any lessons that are currently live
        const liveLessons = await Lesson.find({
            section: { $in: sectionIds },
            isLiveEnabled: true,
            liveStatus: "live",
        }).select("section")

        // Map live lesson sections back to batch IDs
        const sectionToBatch = new Map<string, string>()
        for (const s of sections) {
            sectionToBatch.set(s._id.toString(), s.batch.toString())
        }

        const liveBatchIdsSet = new Set<string>()
        for (const lesson of liveLessons) {
            const bId = sectionToBatch.get(lesson.section.toString())
            if (bId) liveBatchIdsSet.add(bId)
        }

        res.json({ liveBatchIds: Array.from(liveBatchIdsSet) })
    } catch (error) {
        console.error("Error fetching live batches:", error)
        res.status(500).json({ message: "Error fetching live batches" })
    }
}
