"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import {
    ArrowLeft,
    Users,
    Video,
    Layers,
    FileText,
    Clock,
    CheckCircle2,
    Hourglass,
    XCircle,
    BarChart3,
} from "lucide-react"

/* ─── Types ───────────────────────────────────────────────── */

interface SectionBreakdown {
    _id: string
    title: string
    order: number
    lessonCount: number
    totalDuration: number
}

interface EnrollmentItem {
    _id: string
    user: { _id: string; name: string; email: string }
    status: "pending" | "approved" | "rejected"
    createdAt: string
}

interface BatchDetail {
    batch: {
        _id: string
        title: string
        description: string
        thumbnail: string
        createdAt: string
    }
    totalSections: number
    totalLessons: number
    totalNotes: number
    totalDuration: number
    enrollments: EnrollmentItem[]
    approvedCount: number
    pendingCount: number
    rejectedCount: number
    sectionBreakdown: SectionBreakdown[]
}

/* ─── Helpers ─────────────────────────────────────────────── */

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) return `${hrs}h ${mins % 60}m`
    return `${mins}m`
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

/* ─── Component ───────────────────────────────────────────── */

export default function BatchAnalyticsPage() {
    const router = useRouter()
    const params = useParams()
    const batchId = params.batchId as string

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<BatchDetail | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get<BatchDetail>(
                    `/analytics/batches/${batchId}`
                )
                setData(res.data)
            } catch (err: any) {
                console.error(err)
                if (err?.response?.status === 401) {
                    localStorage.removeItem("token")
                    router.push("/login")
                }
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [batchId, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="py-16 text-center">
                <p className="text-gray-400">Batch not found.</p>
                <Link
                    href="/dashboard/analytics"
                    className="mt-4 inline-block text-blue-500 hover:text-blue-400"
                >
                    ← Back to Analytics
                </Link>
            </div>
        )
    }

    const { batch, sectionBreakdown, enrollments } = data
    const totalEnrollments = data.approvedCount + data.pendingCount + data.rejectedCount

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link
                    href="/dashboard/analytics"
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#272D40] text-gray-400 transition-colors hover:bg-[#272D40] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-white truncate">
                        {batch.title}
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Created {new Date(batch.createdAt).toLocaleDateString()} •{" "}
                        Batch Analytics
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Enrolled",
                        value: data.approvedCount,
                        icon: Users,
                        gradient: "from-blue-500 to-cyan-500",
                    },
                    {
                        label: "Total Lessons",
                        value: data.totalLessons,
                        icon: Video,
                        gradient: "from-orange-500 to-amber-500",
                    },
                    {
                        label: "Total Sections",
                        value: data.totalSections,
                        icon: Layers,
                        gradient: "from-pink-500 to-rose-500",
                    },
                    {
                        label: "Content Duration",
                        value: formatDuration(data.totalDuration),
                        icon: Clock,
                        gradient: "from-violet-500 to-purple-500",
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-[#3a4257]"
                    >
                        <div
                            className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-60`}
                        />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                    {stat.label}
                                </p>
                                <p className="mt-1 text-2xl font-bold text-white">
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient}`}
                            >
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two-column: enrollment status + section breakdown */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Enrollment status */}
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                    <div className="border-b border-[#272D40] px-5 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-400" />
                            Enrollment Breakdown
                        </h2>
                    </div>
                    <div className="p-5">
                        <div className="flex items-center justify-center gap-6 py-4">
                            <div className="text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500/30 bg-emerald-500/10">
                                    <span className="text-xl font-bold text-emerald-400">
                                        {data.approvedCount}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">Approved</p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-yellow-500/30 bg-yellow-500/10">
                                    <span className="text-xl font-bold text-yellow-400">
                                        {data.pendingCount}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">Pending</p>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-500/30 bg-red-500/10">
                                    <span className="text-xl font-bold text-red-400">
                                        {data.rejectedCount}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">Rejected</p>
                            </div>
                        </div>

                        {/* Status bar */}
                        {totalEnrollments > 0 && (
                            <div className="mt-4">
                                <div className="flex h-3 overflow-hidden rounded-full bg-[#0F1117]">
                                    <div
                                        className="bg-emerald-500 transition-all duration-500"
                                        style={{
                                            width: `${(data.approvedCount / totalEnrollments) * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="bg-yellow-500 transition-all duration-500"
                                        style={{
                                            width: `${(data.pendingCount / totalEnrollments) * 100}%`,
                                        }}
                                    />
                                    <div
                                        className="bg-red-500 transition-all duration-500"
                                        style={{
                                            width: `${(data.rejectedCount / totalEnrollments) * 100}%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between text-xs text-gray-400">
                                    <span>
                                        {Math.round((data.approvedCount / totalEnrollments) * 100)}%
                                        approved
                                    </span>
                                    <span>{totalEnrollments} total</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section breakdown */}
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                    <div className="border-b border-[#272D40] px-5 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Layers className="h-5 w-5 text-pink-400" />
                            Section Breakdown
                        </h2>
                    </div>
                    {sectionBreakdown.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            No sections yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-[#272D40]/50">
                            {sectionBreakdown
                                .sort((a, b) => a.order - b.order)
                                .map((section, i) => (
                                    <div
                                        key={section._id}
                                        className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[#1e2333]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#272D40] text-xs font-bold text-gray-300">
                                                {i + 1}
                                            </span>
                                            <p className="text-sm font-medium text-white truncate">
                                                {section.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0 ml-2">
                                            <span className="flex items-center gap-1">
                                                <Video className="h-3.5 w-3.5" />
                                                {section.lessonCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDuration(section.totalDuration)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Enrolled students list */}
            <div className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                <div className="border-b border-[#272D40] px-5 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-400" />
                        Enrolled Students
                        <span className="ml-auto text-sm font-normal text-gray-400">
                            {enrollments.length} total
                        </span>
                    </h2>
                </div>
                {enrollments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No enrollments yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#272D40] text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left font-medium">Student</th>
                                    <th className="px-3 py-3 text-left font-medium">Email</th>
                                    <th className="px-3 py-3 text-center font-medium">Status</th>
                                    <th className="px-3 py-3 text-right font-medium">Enrolled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((enrollment) => (
                                    <tr
                                        key={enrollment._id}
                                        className="border-b border-[#272D40]/50 transition-colors hover:bg-[#1e2333]"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${enrollment.status === "approved"
                                                        ? "bg-emerald-500/15 text-emerald-400"
                                                        : enrollment.status === "pending"
                                                            ? "bg-yellow-500/15 text-yellow-400"
                                                            : "bg-red-500/15 text-red-400"
                                                        }`}
                                                >
                                                    {enrollment.user?.name?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <span className="font-medium text-white">
                                                    {enrollment.user?.name || "Unknown"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-400">
                                            {enrollment.user?.email || "—"}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${enrollment.status === "approved"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : enrollment.status === "pending"
                                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    }`}
                                            >
                                                {enrollment.status === "approved" && (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                )}
                                                {enrollment.status === "pending" && (
                                                    <Hourglass className="h-3 w-3" />
                                                )}
                                                {enrollment.status === "rejected" && (
                                                    <XCircle className="h-3 w-3" />
                                                )}
                                                {enrollment.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right text-gray-500 text-xs">
                                            {timeAgo(enrollment.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
