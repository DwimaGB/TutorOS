import mongoose from "mongoose"

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,

    videoUrl: {
      type: String,
      default: "",
    },

    publicId: {
      type: String,
      default: "",
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    order: { type: Number, default: 0 },

    duration: { type: Number, default: 0 }, // duration in seconds

    // ─── Live class fields ───
    isLiveEnabled: { type: Boolean, default: false },

    livePlatform: {
      type: String,
      enum: ["zoom", "youtube", "other"],
      default: "zoom",
    },

    liveJoinUrl: { type: String, default: "" },

    liveStartAt: { type: Date, default: null },

    liveStatus: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },
  },
  { timestamps: true }
)

lessonSchema.index({ section: 1, order: 1 })

export default mongoose.model("Lesson", lessonSchema)