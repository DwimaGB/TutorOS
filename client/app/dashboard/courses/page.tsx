"use client"

import { useEffect, useState } from "react"
import type { AxiosError } from "axios"
import { api } from "@/lib/api"
import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"

interface Course {
  _id: string
  title: string
  description: string
  price?: number
}

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
}

interface Lesson {
  _id: string
  title: string
  videoUrl: string
}

export default function DashboardCoursesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loadingLessonsFor, setLoadingLessonsFor] = useState<string | null>(null)
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null)
  const [enrollingFor, setEnrollingFor] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser) as User)
    }

    const fetchCourses = async () => {
      try {
        const res = await api.get<Course[]>("/courses")
        setCourses(res.data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchCourses()
  }, [])

  const handleViewLessons = async (courseId: string) => {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null)
      setLessons([])
      return
    }
    setSelectedCourseId(courseId)
    setLoadingLessonsFor(courseId)
    try {
      const res = await api.get<Lesson[]>(`/lessons/${courseId}`)
      setLessons(res.data)
    } catch (err) {
      console.error(err)
      const status = (err as AxiosError | undefined)?.response?.status
      if (status === 403) {
        setLessons([])
      }
    } finally {
      setLoadingLessonsFor(null)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollMessage(null)
      setEnrollingFor(courseId)
      await api.post(`/enrollment/${courseId}`)
      setEnrollMessage("Enrolled successfully! Check your dashboard for My Courses.")
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const message =
        axiosErr?.response?.data?.message ||
        "Could not enroll in this course. Please try again."
      setEnrollMessage(message)
    } finally {
      setEnrollingFor(null)
    }
  }

  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">All Courses</h1>
      </div>

      {enrollMessage && (
        <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
          {enrollMessage}
        </p>
      )}

      {courses.length === 0 ? (
        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <p className="text-gray-400">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course._id}
              className="rounded-xl border border-[#272D40] bg-[#181C27] p-5 space-y-4"
            >
              <div>
                <h2 className="text-lg font-semibold text-white">{course.title}</h2>
                <p className="mt-1 text-sm text-gray-400">{course.description}</p>
                {typeof course.price === "number" && (
                  <p className="mt-1 text-sm font-medium text-blue-400">
                    ₹{course.price.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewLessons(course._id)}
                  className="rounded-lg bg-[#272D40] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#323948]"
                >
                  {loadingLessonsFor === course._id
                    ? "Loading..."
                    : selectedCourseId === course._id
                      ? "Hide Lessons"
                      : "View Lessons"}
                </button>

                {!isAdmin && (
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrollingFor === course._id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                  >
                    {enrollingFor === course._id ? "Enrolling..." : "Enroll"}
                  </button>
                )}

                {isAdmin && (
                  <Link href={`/courses/${course._id}/add-lesson`}>
                    <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                      <Plus className="h-3.5 w-3.5" />
                      Add Lesson
                    </button>
                  </Link>
                )}
              </div>

              {/* Lessons List */}
              {selectedCourseId === course._id && lessons.length > 0 && (
                <div className="space-y-2 border-t border-[#272D40] pt-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    Lessons ({lessons.length})
                  </h3>
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson._id}
                      className="flex items-center gap-3 rounded-lg bg-[#0F1117] p-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#272D40] text-xs font-semibold text-gray-400">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{lesson.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
