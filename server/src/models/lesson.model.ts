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
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },

    order: { type: Number, default: 0 },

    duration: { type: Number, default: 0 }, // duration in seconds
  },
  { timestamps: true }
)

lessonSchema.index({ section: 1, order: 1 })

export default mongoose.model("Lesson", lessonSchema)