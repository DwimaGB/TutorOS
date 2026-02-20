import mongoose from "mongoose"

const noteSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: String,
        fileUrl: { type: String, required: true },
        publicId: { type: String, required: true },
        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
        },
    },
    { timestamps: true }
)

export default mongoose.model("Note", noteSchema)
