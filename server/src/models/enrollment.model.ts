import mongoose from "mongoose"

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Prevent duplicate enrollments for the same user + course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true })

export default mongoose.model("Enrollment", enrollmentSchema)