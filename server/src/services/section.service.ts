import mongoose from "mongoose"
import Section from "../models/section.model.js"
import Lesson from "../models/lesson.model.js"
import Note from "../models/note.model.js"
import Batch from "../models/batch.model.js"

export async function createSection(batchId: string, title: string, order?: number) {
    const batch = await Batch.findById(batchId)
    if (!batch) throw new Error("Batch not found")

    // Auto-assign order if not provided
    if (typeof order !== "number") {
        const count = await Section.countDocuments({ batch: batchId })
        order = count
    }

    return await Section.create({
        title,
        order,
        batch: new mongoose.Types.ObjectId(batchId),
    })
}

export async function getSectionsByBatch(batchId: string) {
    const sections = await Section.find({ batch: batchId }).sort({ order: 1 }).lean()

    // For each section, fetch lessons with count & total duration
    const enriched = await Promise.all(
        sections.map(async (section) => {
            const lessons = await Lesson.find({ section: section._id }).sort({ order: 1 }).lean()
            const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
            return {
                ...section,
                lessons,
                lessonCount: lessons.length,
                totalDuration,
            }
        })
    )

    return enriched
}

export async function updateSection(sectionId: string, updates: { title?: string; order?: number }) {
    const section = await Section.findById(sectionId)
    if (!section) throw new Error("Section not found")

    if (typeof updates.title === "string" && updates.title.trim()) {
        section.title = updates.title
    }
    if (typeof updates.order === "number") {
        section.order = updates.order
    }

    return await section.save()
}

export async function deleteSection(sectionId: string) {
    const section = await Section.findByIdAndDelete(sectionId)
    if (!section) throw new Error("Section not found")

    // Cascade: delete lessons → notes
    const lessons = await Lesson.find({ section: section._id })
    const lessonIds = lessons.map((l) => l._id)
    await Note.deleteMany({ lesson: { $in: lessonIds } })
    await Lesson.deleteMany({ section: section._id })

    return section
}
