"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { AxiosError } from "axios"
import Link from "next/link"
import { BookOpen, ArrowRight, Plus, Users, Layout, Video, Hourglass, Clock } from "lucide-react"

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

export default function Dashboard() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
          const res = await api.get<Batch[]>("/batches")
          setBatches(res.data)
        } else {
          const res = await api.get<Enrollment[]>("/enrollment/my")
          setEnrollments(res.data)
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

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {user && (
            <p className="mt-2 text-gray-400">
              Welcome back, <span className="font-semibold text-gray-300">{user.name}</span>{" "}
              <span className="rounded bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-400 uppercase tracking-wider">
                {user.role === "admin" ? "teacher" : user.role}
              </span>
            </p>
          )}
        </div>
        {user?.role === "admin" && (
          <Link href="/create-batch">
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Batch
            </button>
          </Link>
        )}
      </section>

      {user?.role === "admin" ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Batches", value: batches.length, icon: BookOpen, color: "text-blue-500" },
              { label: "Total Students", value: "--", icon: Users, color: "text-purple-500" },
              { label: "Active Lessons", value: "--", icon: Video, color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-[#272D40] bg-[#181C27] p-5">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">Batch Management</h2>
            {batches.length === 0 ? (
              <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                <p className="text-gray-400">No batches created yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {batches.map((batch) => (
                  <div key={batch._id} className="group rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-blue-500/30">
                    <h3 className="font-semibold text-white">{batch.title}</h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">{batch.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/batches/${batch._id}`} className="text-sm text-blue-500 hover:text-blue-400">
                        View Details
                      </Link>
                      <span className="text-gray-600 text-sm">|</span>
                      <Link href={`/batches/${batch._id}/manage`} className="text-sm text-gray-400 hover:text-white">
                        Manage Content
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-8">
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
                    <div className="group rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-blue-500/30">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {enrollment.batch.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {enrollment.batch.description}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm text-blue-500">
                        Continue Learning <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}