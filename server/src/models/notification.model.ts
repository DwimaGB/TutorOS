import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: [
                "lesson_uploaded",
                "note_added",
                "live_scheduled",
                "live_started",
                "recording_uploaded",
            ],
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
        },

        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
        },

        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
)

notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ user: 1, read: 1 })

export default mongoose.model("Notification", notificationSchema)
