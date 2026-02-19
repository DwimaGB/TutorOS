"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { AxiosError } from "axios"
import Link from "next/link"
import { BookOpen, ArrowRight, Plus, Users, Layout, Video } from "lucide-react"

interface Course {
  _id: string
  title: string
  description: string
}

interface Enrollment {
  _id: string
  course: Course
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
  const [courses, setCourses] = useState<Course[]>([])
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
          // Admin view: fetch all courses for management
          const res = await api.get<Course[]>("/courses")
          setCourses(res.data)
        } else {
          // Student view: fetch enrollments
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

  // Defensive: filter enrollments that have null courses
  const validEnrollments = enrollments.filter((e) => e.course)

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {user && (
            <p className="mt-2 text-gray-400">
              Welcome back, <span className="font-semibold text-gray-300">{user.name}</span>{" "}
              <span className="rounded bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-400 uppercase tracking-wider">
                {user.role}
              </span>
            </p>
          )}
        </div>
        {user?.role === "admin" && (
          <Link href="/dashboard/courses">
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              New Course
            </button>
          </Link>
        )}
      </section>

      {user?.role === "admin" ? (
        /* Admin View */
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Courses", value: courses.length, icon: BookOpen, color: "text-blue-500" },
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
            <h2 className="mb-4 text-xl font-semibold text-white">Course Management</h2>
            {courses.length === 0 ? (
              <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                <p className="text-gray-400">No courses created yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map((course) => (
                  <div key={course._id} className="group rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-blue-500/30">
                    <h3 className="font-semibold text-white">{course.title}</h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">{course.description}</p>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/courses/${course._id}`} className="text-sm text-blue-500 hover:text-blue-400">
                        View Details
                      </Link>
                      <span className="text-gray-600 text-sm">|</span>
                      <Link href={`/courses/${course._id}/add-lesson`} className="text-sm text-gray-400 hover:text-white">
                        Add Lesson
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Student View */
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">My Learning</h2>
          {validEnrollments.length === 0 ? (
            <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">You are not enrolled in any courses yet.</p>
              <Link href="/courses">
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  Browse Courses
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {validEnrollments.map((enrollment) => (
                <Link href={`/learn/${enrollment.course._id}`} key={enrollment._id}>
                  <div className="group rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-blue-500/30">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {enrollment.course.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                      {enrollment.course.description}
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
      )}
    </div>
  )
}