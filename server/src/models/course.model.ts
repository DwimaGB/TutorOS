import mongoose from "mongoose"

const courseSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    thumbnail: String,
    price: Number,
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
)

export default mongoose.model("Course", courseSchema)