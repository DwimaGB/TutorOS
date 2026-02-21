"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Hourglass, BookOpen, Mail, Clock } from "lucide-react"

interface PendingEnrollment {
    _id: string
    user: {
        _id: string
        name: string
        email: string
    }
    batch: {
        _id: string
        title: string
        description: string
    }
    status: string
    createdAt: string
}

export default function EnrollmentRequestsPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<PendingEnrollment[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
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

        const fetchPending = async () => {
            try {
                const res = await api.get<PendingEnrollment[]>("/enrollment/pending")
                setRequests(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchPending()
    }, [router])

    const handleApprove = async (enrollmentId: string) => {
        setActionLoading(enrollmentId)
        setError(null)
        setMessage(null)
        try {
            await api.put(`/enrollment/${enrollmentId}/approve`)
            setRequests((prev) => prev.filter((r) => r._id !== enrollmentId))
            setMessage("Enrollment approved successfully.")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to approve enrollment.")
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (enrollmentId: string) => {
        if (!window.confirm("Are you sure you want to reject this enrollment request?")) return
        setActionLoading(enrollmentId)
        setError(null)
        setMessage(null)
        try {
            await api.put(`/enrollment/${enrollmentId}/reject`)
            setRequests((prev) => prev.filter((r) => r._id !== enrollmentId))
            setMessage("Enrollment rejected.")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to reject enrollment.")
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center py-20"><p className="text-gray-400">Loading requests...</p></div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Enrollment Requests</h1>
                <p className="mt-1 text-sm text-gray-400">
                    {requests.length} pending request{requests.length !== 1 ? "s" : ""}
                </p>
            </div>

            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
            {message && <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>}

            {requests.length === 0 ? (
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                    <Hourglass className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                    <p className="text-gray-400">No pending enrollment requests.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div key={req._id} className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                                {/* Student + Batch info */}
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                                        {req.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-white">{req.user.name}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Mail className="h-3 w-3" />{req.user.email}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="h-3 w-3" />
                                                {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                                            <span className="text-sm text-blue-400 font-medium">{req.batch.title}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApprove(req._id)}
                                        disabled={actionLoading === req._id}
                                        className="flex items-center gap-1.5 rounded-lg bg-green-600/10 border border-green-500/20 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/20 hover:border-green-500/40 disabled:opacity-50"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(req._id)}
                                        disabled={actionLoading === req._id}
                                        className="flex items-center gap-1.5 rounded-lg bg-red-600/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/20 hover:border-red-500/40 disabled:opacity-50"
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
        </div>
    )
}
