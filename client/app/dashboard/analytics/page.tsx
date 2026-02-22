"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import {
    Users,
    BookOpen,
    Video,
    TrendingUp,
    CheckCircle2,
    Hourglass,
    FileText,
    Layers,
    ArrowLeft,
    BarChart3,
    Clock,
} from "lucide-react"

/* ─── Types ───────────────────────────────────────────────── */

interface OverviewStats {
    totalStudents: number
    totalBatches: number
    totalEnrollments: number
    totalLessons: number
    totalSections: number
    totalNotes: number
    pendingEnrollments: number
    approvedEnrollments: number
    rejectedEnrollments: number
}

interface BatchAnalytics {
    _id: string
    title: string
    enrollmentCount: number
    approvedCount: number
    pendingCount: number
    totalSections: number
    totalLessons: number
    totalNotes: number
    totalDuration: number
    createdAt: string
}

interface StudentAnalytics {
    totalStudents: number
    avgEnrollments: number
    topStudents: {
        _id: string
        enrollmentCount: number
        user: { name: string; email: string }
    }[]
}

/* ─── Helpers ─────────────────────────────────────────────── */

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) return `${hrs}h ${mins % 60}m`
    return `${mins}m`
}

/* ─── Component ───────────────────────────────────────────── */

export default function AnalyticsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [overview, setOverview] = useState<OverviewStats | null>(null)
    const [batches, setBatches] = useState<BatchAnalytics[]>([])
    const [students, setStudents] = useState<StudentAnalytics | null>(null)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [overviewRes, batchesRes, studentsRes] = await Promise.all([
                    api.get<OverviewStats>("/analytics/overview"),
                    api.get<BatchAnalytics[]>("/analytics/batches"),
                    api.get<StudentAnalytics>("/analytics/students"),
                ])
                setOverview(overviewRes.data)
                setBatches(batchesRes.data)
                setStudents(studentsRes.data)
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
        fetchAll()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    // Find the maximum enrollment count for horizontal bar sizing
    const maxEnrollment = Math.max(...batches.map((b) => b.enrollmentCount), 1)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#272D40] text-gray-400 transition-colors hover:bg-[#272D40] hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="h-7 w-7 text-blue-400" />
                        Analytics
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Complete overview of your teaching platform
                    </p>
                </div>
            </div>

            {/* Overview stats */}
            {overview && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: "Students",
                            value: overview.totalStudents,
                            icon: Users,
                            gradient: "from-purple-500 to-indigo-600",
                        },
                        {
                            label: "Batches",
                            value: overview.totalBatches,
                            icon: BookOpen,
                            gradient: "from-blue-500 to-cyan-500",
                        },
                        {
                            label: "Enrollments",
                            value: overview.totalEnrollments,
                            icon: TrendingUp,
                            gradient: "from-emerald-500 to-green-500",
                        },
                        {
                            label: "Lessons",
                            value: overview.totalLessons,
                            icon: Video,
                            gradient: "from-orange-500 to-amber-500",
                        },
                        {
                            label: "Sections",
                            value: overview.totalSections,
                            icon: Layers,
                            gradient: "from-pink-500 to-rose-500",
                        },
                        {
                            label: "Notes",
                            value: overview.totalNotes,
                            icon: FileText,
                            gradient: "from-violet-500 to-purple-500",
                        },
                        {
                            label: "Pending",
                            value: overview.pendingEnrollments,
                            icon: Hourglass,
                            gradient: "from-yellow-500 to-orange-400",
                        },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-[#3a4257]"
                        >
                            <div
                                className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-60 transition-opacity group-hover:opacity-100`}
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
            )}

            {/* Enrollment distribution */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Enrollment bar chart */}
                <div className="lg:col-span-3 rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                    <div className="border-b border-[#272D40] px-5 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                            Enrollments per Batch
                        </h2>
                    </div>
                    <div className="p-5 space-y-4">
                        {batches.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No batches yet.</p>
                        ) : (
                            batches
                                .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                                .map((batch) => {
                                    const pct = Math.round(
                                        (batch.enrollmentCount / maxEnrollment) * 100
                                    )
                                    return (
                                        <div key={batch._id}>
                                            <div className="mb-1.5 flex items-center justify-between text-sm">
                                                <Link
                                                    href={`/dashboard/analytics/${batch._id}`}
                                                    className="font-medium text-gray-300 hover:text-white truncate max-w-[260px] transition-colors"
                                                >
                                                    {batch.title}
                                                </Link>
                                                <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0 ml-2">
                                                    <span className="text-blue-400 font-semibold">
                                                        {batch.enrollmentCount} enrolled
                                                    </span>
                                                    <span>
                                                        {batch.totalLessons} lessons
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-3 w-full overflow-hidden rounded-full bg-[#0F1117]">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                                                    style={{ width: `${Math.max(pct, 3)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                        )}
                    </div>
                </div>

                {/* Enrollment breakdown donut-like display */}
                <div className="lg:col-span-2 rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                    <div className="border-b border-[#272D40] px-5 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-teal-400" />
                            Enrollment Status
                        </h2>
                    </div>
                    {overview && (
                        <div className="p-5">
                            <div className="flex items-center justify-center gap-4 py-4">
                                {/* Simple visual stat circles */}
                                <div className="text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-500/30 bg-emerald-500/10">
                                        <span className="text-xl font-bold text-emerald-400">
                                            {overview.approvedEnrollments}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-400">Approved</p>
                                </div>
                                <div className="text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-yellow-500/30 bg-yellow-500/10">
                                        <span className="text-xl font-bold text-yellow-400">
                                            {overview.pendingEnrollments}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-400">Pending</p>
                                </div>
                                <div className="text-center">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-500/30 bg-red-500/10">
                                        <span className="text-xl font-bold text-red-400">
                                            {overview.rejectedEnrollments}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-400">Rejected</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Batch details table */}
            <div className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                <div className="border-b border-[#272D40] px-5 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-blue-400" />
                        Detailed Batch Breakdown
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#272D40] text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-3 text-left font-medium">Batch Name</th>
                                <th className="px-3 py-3 text-center font-medium">Enrolled</th>
                                <th className="px-3 py-3 text-center font-medium">Approved</th>
                                <th className="px-3 py-3 text-center font-medium">Pending</th>
                                <th className="px-3 py-3 text-center font-medium">Sections</th>
                                <th className="px-3 py-3 text-center font-medium">Lessons</th>
                                <th className="px-3 py-3 text-center font-medium">Notes</th>
                                <th className="px-3 py-3 text-center font-medium">Duration</th>
                                <th className="px-3 py-3 text-center font-medium">Created</th>
                                <th className="px-3 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((batch) => (
                                <tr
                                    key={batch._id}
                                    className="border-b border-[#272D40]/50 transition-colors hover:bg-[#1e2333]"
                                >
                                    <td className="px-5 py-3.5 font-medium text-white max-w-[200px] truncate">
                                        {batch.title}
                                    </td>
                                    <td className="px-3 py-3.5 text-center text-gray-300">
                                        {batch.enrollmentCount}
                                    </td>
                                    <td className="px-3 py-3.5 text-center">
                                        <span className="text-emerald-400">{batch.approvedCount}</span>
                                    </td>
                                    <td className="px-3 py-3.5 text-center">
                                        {batch.pendingCount > 0 ? (
                                            <span className="text-yellow-400">{batch.pendingCount}</span>
                                        ) : (
                                            <span className="text-gray-500">0</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3.5 text-center text-gray-300">
                                        {batch.totalSections}
                                    </td>
                                    <td className="px-3 py-3.5 text-center text-gray-300">
                                        {batch.totalLessons}
                                    </td>
                                    <td className="px-3 py-3.5 text-center text-gray-300">
                                        {batch.totalNotes}
                                    </td>
                                    <td className="px-3 py-3.5 text-center text-gray-400">
                                        {formatDuration(batch.totalDuration)}
                                    </td>
                                    <td className="px-3 py-3.5 text-center text-gray-500 text-xs">
                                        {new Date(batch.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-3.5 text-right">
                                        <Link
                                            href={`/dashboard/analytics/${batch._id}`}
                                            className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                                        >
                                            View Details →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Students */}
            {students && students.topStudents.length > 0 && (
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#272D40] px-5 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-400" />
                            Top Students
                        </h2>
                        <div className="text-sm text-gray-400">
                            Avg enrollments per student:{" "}
                            <span className="font-semibold text-white">
                                {students.avgEnrollments}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#272D40] text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-5 py-3 text-left font-medium">#</th>
                                    <th className="px-3 py-3 text-left font-medium">Student</th>
                                    <th className="px-3 py-3 text-left font-medium">Email</th>
                                    <th className="px-3 py-3 text-right font-medium">
                                        Enrollments
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.topStudents.map((s, i) => (
                                    <tr
                                        key={s._id}
                                        className="border-b border-[#272D40]/50 transition-colors hover:bg-[#1e2333]"
                                    >
                                        <td className="px-5 py-3 text-gray-500 font-medium">
                                            {i + 1}
                                        </td>
                                        <td className="px-3 py-3 font-medium text-white">
                                            {s.user.name}
                                        </td>
                                        <td className="px-3 py-3 text-gray-400">{s.user.email}</td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
                                                {s.enrollmentCount}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
