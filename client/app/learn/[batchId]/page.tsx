"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import {
  ArrowLeft, PlayCircle, Lock, FileText, Download,
  ChevronDown, ChevronUp, Radio, Calendar, ExternalLink,
  Clock, Video as VideoIcon,
} from "lucide-react"
import type { AxiosError } from "axios"

interface Lesson {
  _id: string
  title: string
  description?: string
  videoUrl: string
  order: number
  duration: number
  isLiveEnabled: boolean
  livePlatform?: "zoom" | "youtube" | "other"
  liveJoinUrl?: string
  liveStartAt?: string
  liveStatus?: "scheduled" | "live" | "ended"
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

function formatLiveDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  if (isToday) return `Today at ${timeStr}`
  if (isTomorrow) return `Tomorrow at ${timeStr}`
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`
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

  // Determine what the main content area shows for the current lesson
  const isLiveLesson = current?.isLiveEnabled
  const hasRecording = !!current?.videoUrl
  const liveStatus = current?.liveStatus || "scheduled"

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
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {current ? (
            <div className="mx-auto max-w-4xl w-full">
              {/* ─── Content: Video OR Live Class UI ─── */}
              {isLiveLesson && !hasRecording ? (
                /* ─── Live class UI (no recording yet) ─── */
                <div className="overflow-hidden rounded-xl border border-[#272D40] bg-[#181C27] shadow-lg">
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    {liveStatus === "live" ? (
                      <>
                        {/* ─── LIVE NOW ─── */}
                        <div className="mb-6 relative">
                          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30">
                            <Radio className="h-9 w-9 text-white" />
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-1.5 text-sm font-semibold text-red-400 mb-4 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          LIVE NOW
                        </span>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Class is in progress
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-md">
                          Join the live session{current.livePlatform ? ` on ${current.livePlatform.charAt(0).toUpperCase() + current.livePlatform.slice(1)}` : ""}. Click the button below to open in a new tab.
                        </p>
                        {current.liveJoinUrl && (
                          <a
                            href={current.liveJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-red-500/40 hover:scale-[1.02]"
                          >
                            <ExternalLink className="h-5 w-5" />
                            Join Live Class
                          </a>
                        )}
                      </>
                    ) : liveStatus === "ended" ? (
                      <>
                        {/* ─── ENDED, awaiting recording ─── */}
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700">
                          <VideoIcon className="h-9 w-9 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Session ended
                        </h2>
                        <p className="text-gray-400 max-w-md">
                          The live class has ended. The recording will be available here once the instructor uploads it.
                        </p>
                      </>
                    ) : (
                      <>
                        {/* ─── SCHEDULED ─── */}
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                          <Calendar className="h-9 w-9 text-white" />
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400 mb-4">
                          <Calendar className="h-3.5 w-3.5" />
                          Scheduled
                        </span>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Upcoming Live Class
                        </h2>
                        {current.liveStartAt && (
                          <p className="text-lg text-gray-300 mb-2 font-medium">
                            {formatLiveDate(current.liveStartAt)}
                          </p>
                        )}
                        {current.livePlatform && (
                          <p className="text-sm text-gray-500 mb-8">
                            Platform: {current.livePlatform.charAt(0).toUpperCase() + current.livePlatform.slice(1)}
                          </p>
                        )}
                        {current.liveJoinUrl && (
                          <a
                            href={current.liveJoinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
                          >
                            <ExternalLink className="h-5 w-5" />
                            Join Live Class
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* ─── Video player (recorded or live + recording available) ─── */
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
              )}

              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{current.title}</h1>
                  {isLiveLesson && hasRecording && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
                      <VideoIcon className="h-3 w-3" />
                      Recording
                    </span>
                  )}
                </div>
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
              <p className="text-gray-500">
                Lessons are not available for this batch yet. Please check back later.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — Sections & Lessons */}
        <aside className="w-full shrink-0 overflow-y-auto border-t border-[#272D40] bg-[#181C27] lg:w-80 lg:border-t-0 lg:border-l">
          <div className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Content
            </h2>

            {sections.length === 0 ? (
              <p className="text-sm text-gray-500">
                This batch does not have any sections or lessons yet.
              </p>
            ) : sections.map((section) => {
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
                        const isLive = lesson.isLiveEnabled
                        const liveNow = isLive && lesson.liveStatus === "live"
                        const scheduled = isLive && lesson.liveStatus === "scheduled" && !lesson.videoUrl
                        const hasVideo = !!lesson.videoUrl

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
                                : liveNow
                                  ? "bg-red-600 text-white"
                                  : "bg-[#272D40] text-gray-500"
                                }`}
                            >
                              {liveNow ? (
                                <Radio className="h-3 w-3" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="truncate block">{lesson.title}</span>
                              {isLive && !hasVideo && (
                                <span className={`text-[10px] ${liveNow ? "text-red-400" : "text-gray-500"}`}>
                                  {liveNow ? "● Live Now" : scheduled && lesson.liveStartAt ? formatLiveDate(lesson.liveStartAt) : "Ended"}
                                </span>
                              )}
                            </div>
                            {!isLive && lesson.duration > 0 && (
                              <span className="text-xs text-gray-600 shrink-0">{formatDuration(lesson.duration)}</span>
                            )}
                            {liveNow && (
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                            )}
                            {isActive && !liveNow && <PlayCircle className="h-4 w-4 shrink-0 text-blue-400" />}
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
