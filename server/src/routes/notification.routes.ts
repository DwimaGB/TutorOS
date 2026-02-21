import express from "express"
import {
    getNotificationsHandler,
    getUnreadCountHandler,
    markAsReadHandler,
    markAllAsReadHandler,
    getLiveBatchesHandler,
} from "../controllers/notification.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes require authentication
router.get("/", protect, getNotificationsHandler)
router.get("/unread-count", protect, getUnreadCountHandler)
router.get("/live-batches", protect, getLiveBatchesHandler)
router.put("/read-all", protect, markAllAsReadHandler)
router.put("/:notificationId/read", protect, markAsReadHandler)

export default router
