"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import { BookOpen, Plus, Trash2, Edit3, Save, X, Users, Video, FileText, Radio } from "lucide-react"
import type { AxiosError } from "axios"

interface BatchAnalytics {
    _id: string
    title: string
    description: string
    approvedCount: number
    pendingCount: number
    totalSections: number
    totalLessons: number
    totalNotes: number
    totalDuration: number
}

interface User {
    _id: string
    name: string
    role: "student" | "admin"
}

export default function DashboardBatchesPage() {
    const [user, setUser] = useState<User | null>(null)
    const [batches, setBatches] = useState<BatchAnalytics[]>([])
    const [liveBatchIds, setLiveBatchIds] = useState<Set<string>>(new Set())
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Edit batch
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) setUser(JSON.parse(storedUser) as User)

        const fetchBatches = async () => {
            try {
                const [analyticsRes, liveRes] = await Promise.all([
                    api.get<BatchAnalytics[]>("/analytics/batches"),
                    api.get<{ liveBatchIds: string[] }>("/notifications/live-batches"),
                ])
                setBatches(analyticsRes.data)
                setLiveBatchIds(new Set(liveRes.data.liveBatchIds))
            } catch (err) {
                console.error(err)
            }
        }
        fetchBatches()
    }, [])

    const handleUpdate = async () => {
        if (!editingId) return
        setSaving(true)
        setError(null)
        setMessage(null)
        try {
            const res = await api.put<{ _id: string, title: string, description: string }>(`/batches/${editingId}`, {
                title: editTitle,
                description: editDescription,
            })
            setBatches((prev) => prev.map((b) => (b._id === res.data._id ? { ...b, title: res.data.title, description: res.data.description } : b)))
            setEditingId(null)
            setMessage("Batch updated!")
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }> | undefined
            setError(axiosErr?.response?.data?.message || "Failed to update batch.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (batchId: string) => {
        if (!window.confirm("Delete this batch and all its content?")) return
        setError(null)
        setMessage(null)
        try {
            await api.delete(`/batches/${batchId}`)
            setBatches((prev) => prev.filter((b) => b._id !== batchId))
            setMessage("Batch deleted!")
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }> | undefined
            setError(axiosErr?.response?.data?.message || "Failed to delete batch.")
        }
    }

    const isAdmin = user?.role === "admin"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Manage Batches</h1>
                {isAdmin && (
                    <Link href="/create-batch">
                        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4" />
                            New Batch
                        </button>
                    </Link>
                )}
            </div>

            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
            {message && <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>}

            {batches.length === 0 ? (
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                    <p className="text-gray-400">No batches yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {batches.map((batch) => (
                        <div key={batch._id} className={`group flex flex-col justify-between rounded-xl border bg-[#181C27] p-5 transition-all hover:border-blue-500/30 ${liveBatchIds.has(batch._id) ? "border-red-500/30 shadow-lg shadow-red-500/5" : "border-[#272D40]"}`}>
                            {editingId === batch._id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Batch title"
                                    />
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Description"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                                            <Save className="h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="rounded-lg bg-[#272D40] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#323948]">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white">{batch.title}</h3>
                                                {liveBatchIds.has(batch._id) && (
                                                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20 animate-pulse">
                                                        <Radio className="h-2.5 w-2.5" />
                                                        LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {batch.approvedCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Video className="h-3.5 w-3.5" />
                                                    {batch.totalLessons}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    {batch.totalNotes}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 line-clamp-2">{batch.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/batches/${batch._id}`}
                                                className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
                                            >
                                                View Details
                                            </Link>
                                            <span className="text-gray-600 text-sm">|</span>
                                            <Link
                                                href={`/batches/${batch._id}/manage`}
                                                className="text-sm text-gray-400 hover:text-white transition-colors"
                                            >
                                                Manage Content
                                            </Link>
                                            <span className="text-gray-600 text-sm">|</span>
                                            <Link
                                                href={`/dashboard/analytics/${batch._id}`}
                                                className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
                                            >
                                                Analytics
                                            </Link>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setEditingId(batch._id); setEditTitle(batch.title); setEditDescription(batch.description) }}
                                                    className="rounded p-1 text-gray-400 hover:bg-[#272D40] hover:text-white transition-colors"
                                                    title="Edit Batch Info"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(batch._id)}
                                                    className="rounded p-1 text-red-500/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                    title="Delete Batch"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
