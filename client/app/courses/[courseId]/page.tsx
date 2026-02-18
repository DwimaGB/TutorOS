"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft, PlayCircle, Plus, Lock } from "lucide-react"
import type { AxiosError } from "axios"

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  price?: number
}

interface Lesson {
  _id: string
  title: string
  description?: string
  videoUrl: string
}

interface User {
  role: "student" | "admin"
}

export default function CourseDetails() {
  const { courseId } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [lessonsError, setLessonsError] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser)
        setIsAdmin(user.role === "admin")
      } catch { /* ignore */ }
    }

    const fetchData = async () => {
      try {
        const courseRes = await api.get(`/courses/${courseId}`)
        setCourse(courseRes.data)
      } catch (err) {
        console.error(err)
      }

      // Lessons require auth — handle gracefully
      try {
        const lessonsRes = await api.get(`/lessons/${courseId}`)
        setLessons(lessonsRes.data)
      } catch (err) {
        const status = (err as AxiosError)?.response?.status
        if (status === 401) {
          setLessonsError("Please sign in to view lessons.")
        } else if (status === 403) {
          setLessonsError("Enroll in this course to access lessons.")
        } else {
          console.error(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1117]">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Header */}
      <header className="border-b border-[#272D40] bg-[#181C27]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Courses
            </Link>
          </div>
          {isAdmin && (
            <Link href={`/courses/${courseId}/add-lesson`}>
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Course Info */}
        {course && (
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            <p className="mt-3 text-gray-400">{course.description}</p>
            {typeof course.price === "number" && (
              <p className="mt-2 text-lg font-semibold text-blue-500">
                ₹{course.price.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Lessons */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Lessons {!lessonsError && `(${lessons.length})`}
          </h2>

          {lessonsError ? (
            <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
              <Lock className="mx-auto mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">{lessonsError}</p>
              <div className="mt-4 flex justify-center gap-3">
                {lessonsError.includes("sign in") ? (
                  <Link href="/login">
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                      Sign In
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => router.push("/dashboard/courses")}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Browse & Enroll
                  </button>
                )}
              </div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
              <PlayCircle className="mx-auto mb-3 h-10 w-10 text-gray-600" />
              <p className="text-gray-400">No lessons added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <Link href={`/learn/${courseId}`} key={lesson._id}>
                  <div className="group flex items-center gap-4 rounded-xl border border-[#272D40] bg-[#181C27] p-4 transition-all hover:border-blue-500/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-sm font-semibold text-blue-500">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="mt-0.5 text-sm text-gray-500 truncate">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <PlayCircle className="h-5 w-5 shrink-0 text-gray-600 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}