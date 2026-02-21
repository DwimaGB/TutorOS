import type { Response } from "express"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import { getAllStudents, getStudentById, removeStudentFromBatch, adminEnrollStudent, getStudentsByBatch } from "../services/student.service.js"

export const getStudentsHandler = async (_req: AuthRequest, res: Response) => {
    try {
        const students = await getAllStudents()
        res.json(students)
    } catch (error) {
        res.status(500).json({ message: "Error fetching students" })
    }
}

export const getStudentByIdHandler = async (req: AuthRequest, res: Response) => {
    try {
        const result = await getStudentById(req.params.studentId as string)
        if (!result) {
            return res.status(404).json({ message: "Student not found" })
        }
        res.json(result)
    } catch (error) {
        res.status(500).json({ message: "Error fetching student" })
    }
}

export const removeStudentFromBatchHandler = async (req: AuthRequest, res: Response) => {
    try {
        await removeStudentFromBatch(req.params.studentId as string, req.params.batchId as string)
        res.json({ message: "Student removed from batch" })
    } catch (error: any) {
        if (error.message === "Enrollment not found") {
            return res.status(404).json({ message: error.message })
        }
        res.status(500).json({ message: "Error removing student from batch" })
    }
}

export const adminEnrollStudentHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, batchId } = req.body
        if (!studentId || !batchId) {
            return res.status(400).json({ message: "studentId and batchId are required" })
        }
        const enrollment = await adminEnrollStudent(studentId, batchId)
        res.status(201).json(enrollment)
    } catch (error: any) {
        if (error.message === "Student not found" || error.message === "Student already enrolled") {
            return res.status(400).json({ message: error.message })
        }
        res.status(500).json({ message: "Error enrolling student" })
    }
}

export const getStudentsByBatchHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { batchId } = req.params
        const students = await getStudentsByBatch(batchId as string)
        res.json(students)
    } catch (error) {
        res.status(500).json({ message: "Error fetching batch students" })
    }
}
