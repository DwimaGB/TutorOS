"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { AxiosError } from "axios"
import Link from "next/link"
import {
  BookOpen,
  ArrowRight,
  Plus,
  Users,
  Video,
  Hourglass,
  Clock,
  TrendingUp,
  CheckCircle2,
  FileText,
  BarChart3,
  Layers,
  Radio,
} from "lucide-react"

/* ─── Types ───────────────────────────────────────────────── */

interface Batch {
  _id: string
  title: string
  description: string
}

interface Enrollment {
  _id: string
  batch: Batch
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
}

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
  thumbnail: string
  enrollmentCount: number
  approvedCount: number
  pendingCount: number
  totalSections: number
  totalLessons: number
  totalNotes: number
  totalDuration: number
  createdAt: string
}

interface ActivityItem {
  _id: string
  user: { _id: string; name: string; email: string }
  batch: { _id: string; title: string }
  status: string
  createdAt: string
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

export default function Dashboard() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Admin analytics state
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [batchAnalytics, setBatchAnalytics] = useState<BatchAnalytics[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [liveBatchIds, setLiveBatchIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const storedUser = window.localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User
        setUser(parsed)
      } catch {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const token = window.localStorage.getItem("token")
      if (!token) return

      try {
        if (user?.role === "admin") {
          // Fetch all analytics data + live batches in parallel
          const [overviewRes, batchesRes, activityRes, liveRes] = await Promise.all([
            api.get<OverviewStats>("/analytics/overview"),
            api.get<BatchAnalytics[]>("/analytics/batches"),
            api.get<ActivityItem[]>("/analytics/activity"),
            api.get<{ liveBatchIds: string[] }>("/notifications/live-batches"),
          ])
          setOverview(overviewRes.data)
          setBatchAnalytics(batchesRes.data)
          setRecentActivity(activityRes.data)
          setLiveBatchIds(new Set(liveRes.data.liveBatchIds))
        } else {
          const [enrollRes, liveRes] = await Promise.all([
            api.get<Enrollment[]>("/enrollment/my"),
            api.get<{ liveBatchIds: string[] }>("/notifications/live-batches"),
          ])
          setEnrollments(enrollRes.data)
          setLiveBatchIds(new Set(liveRes.data.liveBatchIds))
        }
      } catch (err: unknown) {
        console.error(err)
        const status = (err as AxiosError | undefined)?.response?.status
        if (status === 401) {
          window.localStorage.removeItem("token")
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, router])

  const validEnrollments = enrollments.filter((e) => e.batch)
  const approvedEnrollments = validEnrollments.filter((e) => e.status === "approved")
  const pendingEnrollments = validEnrollments.filter((e) => e.status === "pending")
  const rejectedEnrollments = validEnrollments.filter((e) => e.status === "rejected")

  /* ─── Admin Dashboard ──────────────────────────────────── */

  if (user?.role === "admin") {
    const statCards = overview
      ? [
        {
          label: "Total Students",
          value: overview.totalStudents,
          icon: Users,
          color: "from-purple-500 to-indigo-600",
          bgGlow: "bg-purple-500/10",
        },
        {
          label: "Total Batches",
          value: overview.totalBatches,
          icon: BookOpen,
          color: "from-blue-500 to-cyan-500",
          bgGlow: "bg-blue-500/10",
        },
        {
          label: "Total Enrollments",
          value: overview.totalEnrollments,
          icon: TrendingUp,
          color: "from-emerald-500 to-green-500",
          bgGlow: "bg-emerald-500/10",
        },
        {
          label: "Active Lessons",
          value: overview.totalLessons,
          icon: Video,
          color: "from-orange-500 to-amber-500",
          bgGlow: "bg-orange-500/10",
        },
        {
          label: "Pending Requests",
          value: overview.pendingEnrollments,
          icon: Hourglass,
          color: "from-yellow-500 to-orange-400",
          bgGlow: "bg-yellow-500/10",
        },
      ]
      : []

    return (
      <div className="space-y-8">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {user && (
              <p className="mt-2 text-gray-400">
                Welcome back,{" "}
                <span className="font-semibold text-gray-300">{user.name}</span>{" "}
                <span className="rounded bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-400 uppercase tracking-wider">
                  teacher
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/analytics">
              <button className="flex items-center gap-2 rounded-lg border border-[#272D40] bg-[#181C27] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#272D40] hover:text-white">
                <BarChart3 className="h-4 w-4" />
                Full Analytics
              </button>
            </Link>
            <Link href="/create-batch">
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                New Batch
              </button>
            </Link>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!loading && overview && (
          <>
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((stat, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-[#3a4257] ${stat.bgGlow}`}
                >
                  {/* Gradient accent line */}
                  <div
                    className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.color} opacity-60`}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Two-column layout: Batch Table + Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Batch enrollment table — 2/3 width */}
              <div className="lg:col-span-2 rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#272D40] px-5 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-400" />
                    Batch Overview
                  </h2>
                  <Link
                    href="/dashboard/analytics"
                    className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    View All →
                  </Link>
                </div>

                {batchAnalytics.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No batches created yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#272D40] text-gray-400">
                          <th className="px-5 py-3 text-left font-medium">
                            Batch
                          </th>
                          <th className="px-3 py-3 text-center font-medium">
                            Enrolled
                          </th>
                          <th className="px-3 py-3 text-center font-medium">
                            Sections
                          </th>
                          <th className="px-3 py-3 text-center font-medium">
                            Lessons
                          </th>
                          <th className="px-3 py-3 text-center font-medium">
                            Duration
                          </th>
                          <th className="px-3 py-3 text-center font-medium">
                            Pending
                          </th>
                          <th className="px-3 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchAnalytics.map((batch) => (
                          <tr
                            key={batch._id}
                            className="border-b border-[#272D40]/50 transition-colors hover:bg-[#1e2333]"
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white truncate max-w-[200px]">
                                  {batch.title}
                                </p>
                                {liveBatchIds.has(batch._id) && (
                                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20 animate-pulse">
                                    <Radio className="h-2.5 w-2.5" />
                                    LIVE
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                                {batch.approvedCount}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">
                              {batch.totalSections}
                            </td>
                            <td className="px-3 py-3 text-center text-gray-300">
                              {batch.totalLessons}
                            </td>
                            <td className="px-3 py-3 text-center text-gray-400">
                              {formatDuration(batch.totalDuration)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {batch.pendingCount > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                                  {batch.pendingCount}
                                </span>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Link
                                href={`/dashboard/analytics/${batch._id}`}
                                className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                              >
                                Details →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Activity — 1/3 width */}
              <div className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                <div className="border-b border-[#272D40] px-5 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-400" />
                    Recent Activity
                  </h2>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No activity yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#272D40]/50 max-h-[420px] overflow-y-auto">
                    {recentActivity.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#1e2333]"
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${item.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : item.status === "pending"
                              ? "bg-yellow-500/15 text-yellow-400"
                              : "bg-red-500/15 text-red-400"
                            }`}
                        >
                          {item.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">
                            <span className="font-medium">
                              {item.user?.name || "Unknown"}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400 truncate">
                            {item.status === "approved"
                              ? "Approved for"
                              : item.status === "pending"
                                ? "Requested"
                                : "Rejected from"}{" "}
                            <span className="text-gray-300">
                              {item.batch?.title || "Unknown batch"}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${item.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  /* ─── Student Dashboard ─────────────────────────────────── */

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {user && (
            <p className="mt-2 text-gray-400">
              Welcome back,{" "}
              <span className="font-semibold text-gray-300">{user.name}</span>{" "}
              <span className="rounded bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-400 uppercase tracking-wider">
                {user.role}
              </span>
            </p>
          )}
        </div>
      </section>

      {/* Pending Enrollment Requests */}
      {pendingEnrollments.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
            <Hourglass className="h-5 w-5 text-yellow-400" />
            Pending Requests
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingEnrollments.map((enrollment) => (
              <div key={enrollment._id} className="rounded-xl border border-yellow-500/20 bg-[#181C27] p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white">{enrollment.batch.title}</h3>
                  <span className="shrink-0 ml-2 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-500/20">
                    Pending
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">{enrollment.batch.description}</p>
                <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Requested {new Date(enrollment.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rejected Enrollment Requests */}
      {rejectedEnrollments.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">Rejected Requests</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {rejectedEnrollments.map((enrollment) => (
              <div key={enrollment._id} className="rounded-xl border border-red-500/20 bg-[#181C27] p-5 opacity-70">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white">{enrollment.batch.title}</h3>
                  <span className="shrink-0 ml-2 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                    Rejected
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">{enrollment.batch.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approved — My Learning */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">My Learning</h2>
        {approvedEnrollments.length === 0 ? (
          <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <p className="text-gray-400">
              {pendingEnrollments.length > 0
                ? "Your enrollment requests are pending approval."
                : "You are not enrolled in any batches yet."}
            </p>
            <Link href="/batches">
              <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                Browse Batches
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {approvedEnrollments.map((enrollment) => (
              <Link href={`/learn/${enrollment.batch._id}`} key={enrollment._id}>
                <div className={`group relative rounded-xl border bg-[#181C27] p-5 transition-all hover:border-blue-500/30 ${liveBatchIds.has(enrollment.batch._id)
                  ? "border-red-500/30 shadow-lg shadow-red-500/5"
                  : "border-[#272D40]"
                  }`}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {enrollment.batch.title}
                    </h3>
                    {liveBatchIds.has(enrollment.batch._id) && (
                      <span className="shrink-0 ml-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-500/20 animate-pulse">
                        <Radio className="h-3 w-3" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                    {enrollment.batch.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm text-blue-500">
                      Continue Learning <ArrowRight className="h-3 w-3" />
                    </span>
                    {liveBatchIds.has(enrollment.batch._id) && (
                      <span className="inline-flex items-center gap-1 text-sm text-red-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Join Live
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}