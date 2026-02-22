"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import {
    Users, ChevronDown, ChevronUp, X, BookOpen, Mail, Calendar,
    Search, UserPlus, CheckCircle, XCircle, Hourglass, Clock, Plus,
} from "lucide-react"
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

interface PendingEnrollment {
    _id: string
    user: { _id: string; name: string; email: string }
    batch: { _id: string; title: string; description: string }
    status: string
    createdAt: string
}

export default function ManageStudentsPage() {
    const router = useRouter()
    const [students, setStudents] = useState<Student[]>([])
    const [allBatches, setAllBatches] = useState<Batch[]>([])
    const [pendingRequests, setPendingRequests] = useState<PendingEnrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<StudentDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [enrollModal, setEnrollModal] = useState<string | null>(null) // studentId
    const [selectedBatch, setSelectedBatch] = useState("")
    const [enrolling, setEnrolling] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"students" | "pending">("students")

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")
        if (!storedUser || !token) { router.push("/login"); return }
        try {
            const user = JSON.parse(storedUser)
            if (user.role !== "admin") { router.push("/dashboard"); return }
        } catch { router.push("/login"); return }

        const fetchAll = async () => {
            try {
                const [studentsRes, batchesRes, pendingRes] = await Promise.all([
                    api.get<Student[]>("/students"),
                    api.get<Batch[]>("/batches"),
                    api.get<PendingEnrollment[]>("/enrollment/pending"),
                ])
                setStudents(studentsRes.data)
                setAllBatches(batchesRes.data)
                setPendingRequests(pendingRes.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [router])

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    )

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

    const handleEnrollStudent = async (studentId: string) => {
        if (!selectedBatch) return
        setEnrolling(true)
        setError(null); setMessage(null)
        try {
            await api.post("/students/enroll", { studentId, batchId: selectedBatch })
            setMessage("Student enrolled successfully.")
            setEnrollModal(null)
            setSelectedBatch("")
            // Refresh detail if expanded
            if (expandedId === studentId) {
                const res = await api.get<StudentDetail>(`/students/${studentId}`)
                setDetail(res.data)
            }
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }> | undefined
            setError(axiosErr?.response?.data?.message || "Could not enroll student.")
        } finally {
            setEnrolling(false)
        }
    }

    const handleApprove = async (enrollmentId: string) => {
        setActionLoading(enrollmentId)
        setError(null); setMessage(null)
        try {
            await api.put(`/enrollment/${enrollmentId}/approve`)
            setPendingRequests((prev) => prev.filter((r) => r._id !== enrollmentId))
            setMessage("Enrollment approved.")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to approve.")
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (enrollmentId: string) => {
        if (!window.confirm("Reject this enrollment request?")) return
        setActionLoading(enrollmentId)
        setError(null); setMessage(null)
        try {
            await api.put(`/enrollment/${enrollmentId}/reject`)
            setPendingRequests((prev) => prev.filter((r) => r._id !== enrollmentId))
            setMessage("Enrollment rejected.")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to reject.")
        } finally {
            setActionLoading(null)
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

    // Get batches the student is NOT already enrolled in
    const getAvailableBatches = () => {
        if (!detail) return allBatches
        const enrolledBatchIds = new Set(detail.enrollments.map((e) => e.batch._id))
        return allBatches.filter((b) => !enrolledBatchIds.has(b._id))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="h-6 w-6 text-blue-400" />
                        Manage Students
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        View and manage students and their batch enrollments.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">{students.length} student{students.length !== 1 ? "s" : ""} registered</p>
                    {pendingRequests.length > 0 && (
                        <p className="text-sm text-yellow-400 mt-0.5">{pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}</p>
                    )}
                </div>
            </div>

            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
            {message && <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#272D40] pb-0">
                <button
                    onClick={() => setActiveTab("students")}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === "students"
                        ? "text-blue-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                >
                    All Students
                    {activeTab === "students" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === "pending"
                        ? "text-blue-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                >
                    Pending Requests
                    {pendingRequests.length > 0 && (
                        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-black">
                            {pendingRequests.length}
                        </span>
                    )}
                    {activeTab === "pending" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
                    )}
                </button>
            </div>

            {/* ─── All Students Tab ─────────────────────────────── */}
            {activeTab === "students" && (
                <>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-[#272D40] bg-[#181C27] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                            <Users className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                            <p className="text-gray-400">
                                {search ? "No students match your search." : "No students have registered yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredStudents.map((student) => (
                                <div key={student._id} className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden transition-all hover:border-[#3a4257]">
                                    <button
                                        onClick={() => toggleStudent(student._id)}
                                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#1E2233]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">{student.name}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{student.email}</span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3 w-3" />Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedId === student._id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                    </button>

                                    {expandedId === student._id && (
                                        <div className="border-t border-[#272D40] bg-[#0F1117] px-4 py-4 space-y-3">
                                            {loadingDetail ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                                    Loading...
                                                </div>
                                            ) : detail ? (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium text-gray-300">
                                                            Batch Enrollments ({detail.enrollments.length})
                                                        </h4>
                                                        <button
                                                            onClick={() => {
                                                                setEnrollModal(student._id)
                                                                setSelectedBatch("")
                                                            }}
                                                            className="flex items-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/20"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Enroll in Batch
                                                        </button>
                                                    </div>

                                                    {/* Enroll Modal */}
                                                    {enrollModal === student._id && (
                                                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-3">
                                                            <p className="text-xs font-medium text-blue-400">Select a batch to enroll this student:</p>
                                                            {getAvailableBatches().length === 0 ? (
                                                                <p className="text-xs text-gray-500">Student is already enrolled in all batches.</p>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={selectedBatch}
                                                                        onChange={(e) => setSelectedBatch(e.target.value)}
                                                                        className="flex-1 rounded-lg border border-[#272D40] bg-[#181C27] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                                                                    >
                                                                        <option value="">Choose batch...</option>
                                                                        {getAvailableBatches().map((b) => (
                                                                            <option key={b._id} value={b._id}>{b.title}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleEnrollStudent(student._id)}
                                                                        disabled={!selectedBatch || enrolling}
                                                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                                                    >
                                                                        {enrolling ? "Enrolling..." : "Enroll"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEnrollModal(null)}
                                                                        className="rounded-lg p-2 text-gray-400 hover:bg-[#272D40] hover:text-white"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {detail.enrollments.length === 0 ? (
                                                        <p className="text-sm text-gray-500">Not enrolled in any batches.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {detail.enrollments.filter(e => e.batch).map((enrollment) => (
                                                                <div key={enrollment._id} className="flex items-center justify-between rounded-lg border border-[#272D40] bg-[#181C27] px-3 py-2.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <BookOpen className="h-4 w-4 text-blue-400 shrink-0" />
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
                                                                        className="flex items-center gap-1 rounded-lg bg-red-600/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/20"
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
                </>
            )}

            {/* ─── Pending Requests Tab ────────────────────────── */}
            {activeTab === "pending" && (
                <>
                    {pendingRequests.length === 0 ? (
                        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                            <p className="text-gray-400">No pending enrollment requests.</p>
                            <p className="mt-1 text-xs text-gray-500">All caught up!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingRequests.map((req) => (
                                <div key={req._id} className="rounded-xl border border-yellow-500/10 bg-[#181C27] overflow-hidden transition-all hover:border-yellow-500/20">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 text-sm font-bold text-white">
                                                {req.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-white text-sm">{req.user.name}</p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                                        <Mail className="h-3 w-3" />{req.user.email}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                                                    <span className="text-sm text-blue-400 font-medium">{req.batch.title}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleApprove(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="flex items-center gap-1.5 rounded-lg bg-green-600/10 border border-green-500/20 px-3 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/20 disabled:opacity-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(req._id)}
                                                disabled={actionLoading === req._id}
                                                className="flex items-center gap-1.5 rounded-lg bg-red-600/10 border border-red-500/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/20 disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
