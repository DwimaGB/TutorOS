"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft, PlayCircle, Lock, FileText, Download, ChevronDown, ChevronUp } from "lucide-react"
import type { AxiosError } from "axios"

interface Lesson {
  _id: string
  title: string
  description?: string
  videoUrl: string
  order: number
  duration: number
}

interface Section {
  _id: string
  title: string
  order: number
  lessons: Lesson[]
  lessonCount: number
  totalDuration: number
}

interface Note {
  _id: string
  title: string
  description?: string
  fileUrl: string
  createdAt: string
}

function formatDuration(seconds: number) {
  if (!seconds) return ""
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}h ${rm}m`
  }
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function LearnPage() {
  const { batchId } = useParams()
  const router = useRouter()

  const [sections, setSections] = useState<Section[]>([])
  const [current, setCurrent] = useState<Lesson | null>(null)
  const [currentSectionTitle, setCurrentSectionTitle] = useState("")
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const res = await api.get<Section[]>(`/sections/batch/${batchId}`)
        setSections(res.data)

        // Auto-select first lesson
        if (res.data.length > 0) {
          setExpandedSections(new Set(res.data.map((s) => s._id)))
          const firstSection = res.data[0]
          if (firstSection.lessons.length > 0) {
            setCurrent(firstSection.lessons[0])
            setCurrentSectionTitle(firstSection.title)
            // Fetch notes for first lesson
            try {
              const notesRes = await api.get<Note[]>(`/notes/lesson/${firstSection.lessons[0]._id}`)
              setNotes(notesRes.data)
            } catch { /* ignore */ }
          }
        }
      } catch (err) {
        const status = (err as AxiosError)?.response?.status
        if (status === 401) {
          localStorage.removeItem("token")
          router.push("/login")
        } else if (status === 403) {
          setError("You need to enroll in this batch to access lessons.")
        } else {
          setError("Failed to load content. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [batchId, router])

  const selectLesson = async (lesson: Lesson, sectionTitle: string) => {
    setCurrent(lesson)
    setCurrentSectionTitle(sectionTitle)
    setNotes([])
    try {
      const res = await api.get<Note[]>(`/notes/lesson/${lesson._id}`)
      setNotes(res.data)
    } catch { /* ignore */ }
  }

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          <Link href={`/batches/${batchId}`}>
            <button className="rounded-lg border border-[#272D40] px-4 py-2 text-sm text-gray-300 transition-colors hover:border-blue-500/50 hover:text-white">
              Back to Batch
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Dashboard
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
            href={`/batches/${batchId}`}
            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {current && (
            <div className="min-w-0">
              <span className="text-xs text-gray-500">{currentSectionTitle}</span>
              <span className="mx-2 text-gray-600">›</span>
              <span className="text-sm font-medium text-white">{current.title}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Video Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {current ? (
            <div className="mx-auto max-w-4xl w-full">
              <div className="overflow-hidden rounded-xl border border-[#272D40] bg-black shadow-lg">
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

              {/* Notes for this lesson */}
              {notes.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-3 text-lg font-semibold text-white">
                    📄 Lesson Materials ({notes.length})
                  </h2>
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <button
                        key={note._id}
                        onClick={() =>
                          window.open(
                            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/notes/${note._id}/download`,
                            "_blank"
                          )
                        }
                        className="
                        group flex w-full items-center gap-3 rounded-lg 
                        border border-[#272D40] bg-[#181C27] p-3 text-left
                        hover:border-blue-500/40
                        hover:bg-[#1E2332]
                        hover:shadow-lg hover:shadow-blue-500/10
                        "
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 
                  transition-colors duration-200 group-hover:bg-blue-600/20">
                          <FileText className="h-4 w-4 text-blue-400 transition-colors group-hover:text-blue-300" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {note.title}
                          </p>
                          {note.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {note.description}
                            </p>
                          )}
                        </div>

                        <Download className="h-4 w-4 shrink-0 text-gray-500 transition-colors group-hover:text-blue-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No lessons available.</p>
            </div>
          )}
        </div>

        {/* Sidebar — Sections & Lessons */}
        <aside className="w-full shrink-0 overflow-y-auto border-t border-[#272D40] bg-[#181C27] lg:w-80 lg:border-t-0 lg:border-l">
          <div className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Content
            </h2>

            {sections.map((section) => {
              const isExpanded = expandedSections.has(section._id)
              return (
                <div key={section._id} className="mb-2">
                  <button
                    onClick={() => toggleSection(section._id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-[#272D40]"
                  >
                    <span className="truncate">{section.title}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </button>

                  {isExpanded && (
                    <div className="ml-2 space-y-0.5 mt-1">
                      {section.lessons.map((lesson, index) => {
                        const isActive = current?._id === lesson._id
                        return (
                          <button
                            key={lesson._id}
                            onClick={() => selectLesson(lesson, section.title)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isActive
                              ? "bg-blue-600/10 text-blue-400"
                              : "text-gray-400 hover:bg-[#272D40] hover:text-white"
                              }`}
                          >
                            <div
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold ${isActive
                                ? "bg-blue-600 text-white"
                                : "bg-[#272D40] text-gray-500"
                                }`}
                            >
                              {index + 1}
                            </div>
                            <span className="truncate flex-1">{lesson.title}</span>
                            {lesson.duration > 0 && (
                              <span className="text-xs text-gray-600 shrink-0">{formatDuration(lesson.duration)}</span>
                            )}
                            {isActive && <PlayCircle className="h-4 w-4 shrink-0 text-blue-400" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
