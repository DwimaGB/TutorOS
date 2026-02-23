import Notification from "../models/notification.model.js"
import Enrollment from "../models/enrollment.model.js"
import Section from "../models/section.model.js"

type NotificationType =
    | "lesson_uploaded"
    | "note_added"
    | "live_scheduled"
    | "live_started"
    | "recording_uploaded"

/**
 * Notify all approved students of a batch about an event.
 * Resolves sectionId → batchId automatically.
 */
export async function notifyBatchStudents(opts: {
    sectionId: string
    type: NotificationType
    message: string
    lessonId?: string
}) {
    try {
        // Resolve section → batch
        const section = await Section.findById(opts.sectionId)
        if (!section) return

        const batchId = section.batch

        // Find all approved enrollments for this batch
        const enrollments = await Enrollment.find({
            batch: batchId,
            status: "approved",
        }).select("user")

        if (enrollments.length === 0) return

        // Bulk-create notifications
        const docs = enrollments.map((e) => ({
            user: e.user,
            type: opts.type,
            message: opts.message,
            batch: batchId,
            ...(opts.lessonId ? { lesson: opts.lessonId } : {}),
        }))

        await Notification.insertMany(docs)
    } catch (err) {
        // Don't let notification failures break the main flow
        console.error("Error creating notifications:", err)
    }
}

/**
 * Get notifications for a specific user.
 */
export async function getNotificationsForUser(
    userId: string,
    limit = 30,
    unreadOnly = false
) {
    const filter: any = { user: userId }
    if (unreadOnly) filter.read = false

    return await Notification.find(filter)
        .populate("batch", "title")
        .sort({ createdAt: -1 })
        .limit(limit)
}

/**
 * Get unread count for a user.
 */
export async function getUnreadCount(userId: string) {
    return await Notification.countDocuments({ user: userId, read: false })
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
    return await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { returnDocument: "after" }
    )
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
    return await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
    )
}
