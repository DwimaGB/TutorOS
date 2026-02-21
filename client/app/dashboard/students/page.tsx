"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Users, ChevronDown, ChevronUp, X, BookOpen, Mail, Calendar } from "lucide-react"
import type { AxiosError } from "axios"

interface Student {
    _id: string
    name: string
    email: string
    createdAt: string
}

interface Batch {
    _id: string
    title: string
    description: string
}

interface Enrollment {
    _id: string
    batch: Batch
    status: "pending" | "approved" | "rejected"
}

interface StudentDetail {
    student: Student
    enrollments: Enrollment[]
}

export default function StudentsPage() {
    const router = useRouter()
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<StudentDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")
        if (!storedUser || !token) { router.push("/login"); return }
        try {
            const user = JSON.parse(storedUser)
            if (user.role !== "admin") { router.push("/dashboard"); return }
        } catch { router.push("/login"); return }

        const fetchStudents = async () => {
            try {
                const res = await api.get<Student[]>("/students")
                setStudents(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchStudents()
    }, [router])

    const toggleStudent = async (studentId: string) => {
        if (expandedId === studentId) {
            setExpandedId(null)
            setDetail(null)
            return
        }
        setExpandedId(studentId)
        setLoadingDetail(true)
        try {
            const res = await api.get<StudentDetail>(`/students/${studentId}`)
            setDetail(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleRemoveFromBatch = async (studentId: string, batchId: string) => {
        if (!window.confirm("Remove this student from the batch?")) return
        try {
            setError(null); setMessage(null)
            await api.delete(`/students/${studentId}/batches/${batchId}`)
            setMessage("Student removed from batch.")
            if (detail) {
                setDetail({ ...detail, enrollments: detail.enrollments.filter((e) => e.batch._id !== batchId) })
            }
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }> | undefined
            setError(axiosErr?.response?.data?.message || "Could not remove student.")
        }
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">Approved</span>
            case "pending":
                return <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">Pending</span>
            case "rejected":
                return <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">Rejected</span>
            default:
                return null
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center py-20"><p className="text-gray-400">Loading students...</p></div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Students</h1>
                <p className="mt-1 text-sm text-gray-400">{students.length} student{students.length !== 1 ? "s" : ""} registered</p>
            </div>

            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
            {message && <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>}

            {students.length === 0 ? (
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                    <p className="text-gray-400">No students have registered yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {students.map((student) => (
                        <div key={student._id} className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                            <button
                                onClick={() => toggleStudent(student._id)}
                                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-[#1E2233]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{student.name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{student.email}</span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3 w-3" />Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {expandedId === student._id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                            </button>

                            {expandedId === student._id && (
                                <div className="border-t border-[#272D40] bg-[#0F1117] px-5 py-4 space-y-3">
                                    {loadingDetail ? (
                                        <p className="text-sm text-gray-400">Loading details...</p>
                                    ) : detail ? (
                                        <>
                                            <h4 className="text-sm font-medium text-gray-300">Enrollments ({detail.enrollments.length})</h4>
                                            {detail.enrollments.length === 0 ? (
                                                <p className="text-sm text-gray-500">Not enrolled in any batches.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {detail.enrollments.filter(e => e.batch).map((enrollment) => (
                                                        <div key={enrollment._id} className="flex items-center justify-between rounded-lg border border-[#272D40] bg-[#181C27] px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <BookOpen className="h-4 w-4 text-blue-400" />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-medium text-white">{enrollment.batch.title}</p>
                                                                        {statusBadge(enrollment.status)}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 line-clamp-1">{enrollment.batch.description}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveFromBatch(student._id, enrollment.batch._id)}
                                                                className="flex items-center gap-1 rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/20"
                                                            >
                                                                <X className="h-3 w-3" />Remove
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
