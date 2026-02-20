"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft, PlayCircle, Lock, ChevronDown, ChevronUp, Clock } from "lucide-react"
import type { AxiosError } from "axios"

interface Batch {
    _id: string
    title: string
    description: string
    thumbnail?: string
}

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

interface User {
    role: "student" | "admin"
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

export default function BatchDetails() {
    const { batchId } = useParams()
    const router = useRouter()
    const [batch, setBatch] = useState<Batch | null>(null)
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [sectionsError, setSectionsError] = useState<string | null>(null)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [enrolling, setEnrolling] = useState(false)
    const [enrollMsg, setEnrollMsg] = useState<string | null>(null)

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
                const batchRes = await api.get(`/batches/${batchId}`)
                setBatch(batchRes.data)
            } catch (err) {
                console.error(err)
            }

            try {
                const sectionsRes = await api.get<Section[]>(`/sections/batch/${batchId}`)
                setSections(sectionsRes.data)
                // Auto-expand first section
                if (sectionsRes.data.length > 0) {
                    setExpandedSections(new Set([sectionsRes.data[0]._id]))
                }
            } catch (err) {
                const status = (err as AxiosError)?.response?.status
                if (status === 401) {
                    setSectionsError("Please sign in to view content.")
                } else if (status === 403) {
                    setSectionsError("Enroll in this batch to access content.")
                } else {
                    console.error(err)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [batchId])

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev)
            if (next.has(sectionId)) {
                next.delete(sectionId)
            } else {
                next.add(sectionId)
            }
            return next
        })
    }

    const handleEnroll = async () => {
        setEnrolling(true)
        setEnrollMsg(null)
        try {
            await api.post(`/enrollment/${batchId}`)
            setEnrollMsg("Enrolled successfully!")
            setTimeout(() => router.push("/dashboard"), 1200)
        } catch (err: any) {
            setEnrollMsg(err?.response?.data?.message || "Could not enroll. Please try again.")
        } finally {
            setEnrolling(false)
        }
    }

    const totalLessons = sections.reduce((sum, s) => sum + s.lessonCount, 0)
    const totalDuration = sections.reduce((sum, s) => sum + s.totalDuration, 0)

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0F1117]">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0F1117]">
            <header className="border-b border-[#272D40] bg-[#181C27]">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Dashboard
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin ? (
                            <Link href={`/batches/${batchId}/manage`}>
                                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                                    Manage Content
                                </button>
                            </Link>
                        ) : (
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                            >
                                {enrolling ? "Enrolling..." : "Enroll in Batch"}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-10">
                {enrollMsg && (
                    <p className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
                        {enrollMsg}
                    </p>
                )}

                {batch && (
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-white">{batch.title}</h1>
                        <p className="mt-3 text-gray-400">{batch.description}</p>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                            <span>{sections.length} section{sections.length !== 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span>{totalLessons} lesson{totalLessons !== 1 ? "s" : ""}</span>
                            {totalDuration > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDuration(totalDuration)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Sections */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-white">Content</h2>

                    {sectionsError ? (
                        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                            <Lock className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                            <p className="text-gray-400">{sectionsError}</p>
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                            <p className="text-gray-400">No content added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sections.map((section) => {
                                const isExpanded = expandedSections.has(section._id)
                                return (
                                    <div
                                        key={section._id}
                                        className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleSection(section._id)}
                                            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#1E2233]"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-white">{section.title}</h3>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {section.lessonCount} lesson{section.lessonCount !== 1 ? "s" : ""}
                                                    {section.totalDuration > 0 && ` • ${formatDuration(section.totalDuration)}`}
                                                </p>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>

                                        {isExpanded && section.lessons.length > 0 && (
                                            <div className="border-t border-[#272D40] bg-[#0F1117]">
                                                {section.lessons.map((lesson, index) => (
                                                    <Link href={`/learn/${batchId}`} key={lesson._id}>
                                                        <div className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[#181C27] border-b border-[#272D40] last:border-b-0">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-xs font-semibold text-blue-500">
                                                                {index + 1}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                                                    {lesson.title}
                                                                </p>
                                                                {lesson.description && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        {lesson.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {lesson.duration > 0 && (
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDuration(lesson.duration)}
                                                                </span>
                                                            )}
                                                            <PlayCircle className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-blue-500 transition-colors" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
