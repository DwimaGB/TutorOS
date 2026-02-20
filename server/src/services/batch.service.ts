import Batch from "../models/batch.model.js"
import Section from "../models/section.model.js"
import Lesson from "../models/lesson.model.js"
import Note from "../models/note.model.js"
import Enrollment from "../models/enrollment.model.js"

export async function createBatch(data: any) {
    return await Batch.create(data)
}

export async function getBatches() {
    return await Batch.find().populate("instructor", "name").sort({ createdAt: -1 })
}

export async function getBatchById(id: string) {
    return await Batch.findById(id)
}

export async function updateBatch(id: string, updates: any) {
    const batch = await Batch.findById(id)
    if (!batch) return null

    if (typeof updates.title === "string" && updates.title.trim()) {
        batch.title = updates.title
    }
    if (typeof updates.description === "string" && updates.description.trim()) {
        batch.description = updates.description
    }

    return await batch.save()
}

export async function deleteBatch(id: string) {
    const batch = await Batch.findByIdAndDelete(id)
    if (!batch) return null

    // Cascade delete: sections → lessons → notes, and enrollments
    const sections = await Section.find({ batch: batch._id })
    const sectionIds = sections.map((s) => s._id)

    const lessons = await Lesson.find({ section: { $in: sectionIds } })
    const lessonIds = lessons.map((l) => l._id)

    await Note.deleteMany({ lesson: { $in: lessonIds } })
    await Lesson.deleteMany({ section: { $in: sectionIds } })
    await Section.deleteMany({ batch: batch._id })
    await Enrollment.deleteMany({ batch: batch._id })

    return batch
}
