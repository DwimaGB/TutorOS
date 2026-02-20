import mongoose from "mongoose"

const sectionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        order: { type: Number, default: 0 },
        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
        },
    },
    { timestamps: true }
)

sectionSchema.index({ batch: 1, order: 1 })

export default mongoose.model("Section", sectionSchema)
