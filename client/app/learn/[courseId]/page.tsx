"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft, PlayCircle, Lock } from "lucide-react"
import type { AxiosError } from "axios"

interface Lesson {
  _id: string
  title: string
  description?: string
  videoUrl: string
}

export default function LearnPage() {
  const { courseId } = useParams()
  const router = useRouter()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [current, setCurrent] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchLessons = async () => {
      try {
        const res = await api.get(`/lessons/${courseId}`)
        setLessons(res.data)
        if (res.data.length > 0) {
          setCurrent(res.data[0])
        }
      } catch (err) {
        const status = (err as AxiosError)?.response?.status
        if (status === 401) {
          localStorage.removeItem("token")
          router.push("/login")
        } else if (status === 403) {
          setError("You need to enroll in this course to access lessons.")
        } else {
          setError("Failed to load lessons. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [courseId, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1117]">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1117] px-4">
        <Lock className="mb-4 h-12 w-12 text-gray-600" />
        <p className="text-lg text-gray-400">{error}</p>
        <div className="mt-6 flex gap-3">
          <Link href={`/courses/${courseId}`}>
            <button className="rounded-lg border border-[#272D40] px-4 py-2 text-sm text-gray-300 transition-colors hover:border-blue-500/50 hover:text-white">
              Back to Course
            </button>
          </Link>
          <Link href="/dashboard/courses">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Browse & Enroll
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1117]">
      {/* Header */}
      <header className="shrink-0 border-b border-[#272D40] bg-[#181C27]">
        <div className="flex items-center gap-4 px-6 py-3">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Link>
          {current && (
            <span className="text-sm font-medium text-white">{current.title}</span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {current ? (
            <div>
              <div className="overflow-hidden rounded-xl border border-[#272D40] bg-black">
                <video
                  controls
                  key={current._id}
                  className="w-full aspect-video"
                >
                  <source src={current.videoUrl} />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-6">
                <h1 className="text-2xl font-bold text-white">{current.title}</h1>
                {current.description && (
                  <p className="mt-2 text-gray-400">{current.description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No lessons available.</p>
            </div>
          )}
        </div>

        {/* Lesson Sidebar */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-[#272D40] bg-[#181C27]">
          <div className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Lessons ({lessons.length})
            </h2>

            <div className="space-y-1">
              {lessons.map((lesson, index) => {
                const isActive = current?._id === lesson._id

                return (
                  <button
                    key={lesson._id}
                    onClick={() => setCurrent(lesson)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${isActive
                        ? "bg-blue-600/10 text-blue-400"
                        : "text-gray-300 hover:bg-[#272D40] hover:text-white"
                      }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-semibold ${isActive
                          ? "bg-blue-600 text-white"
                          : "bg-[#272D40] text-gray-400"
                        }`}
                    >
                      {index + 1}
                    </div>
                    <span className="truncate">{lesson.title}</span>
                    {isActive && (
                      <PlayCircle className="ml-auto h-4 w-4 shrink-0 text-blue-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}