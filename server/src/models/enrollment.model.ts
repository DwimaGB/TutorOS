import mongoose from "mongoose"

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Prevent duplicate enrollments for the same user + batch
enrollmentSchema.index({ user: 1, batch: 1 }, { unique: true })

export default mongoose.model("Enrollment", enrollmentSchema)