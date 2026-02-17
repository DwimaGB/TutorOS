import mongoose from "mongoose"

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model("Enrollment", enrollmentSchema)