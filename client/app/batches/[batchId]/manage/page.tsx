"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import {
    ArrowLeft, Plus, Trash2, Edit3, Save, X, Upload, Loader2,
    ChevronDown, ChevronUp, FileText, Download, Radio, Video as VideoIcon,
    Calendar, ExternalLink, Clock,
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

interface Note {
    _id: string
    title: string
    description?: string
    fileUrl: string
    createdAt: string
}

interface Section {
    _id: string
    title: string
    order: number
    lessons: Lesson[]
    lessonCount: number
    totalDuration: number
}

export default function BatchManagePage() {
    const { batchId } = useParams()
    const router = useRouter()
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

    // New section form
    const [newSectionTitle, setNewSectionTitle] = useState("")
    const [addingSection, setAddingSection] = useState(false)

    // Edit section
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
    const [editSectionTitle, setEditSectionTitle] = useState("")

    // Add lesson form
    const [addLessonToSection, setAddLessonToSection] = useState<string | null>(null)
    const [lessonTitle, setLessonTitle] = useState("")
    const [lessonDescription, setLessonDescription] = useState("")
    const [lessonVideo, setLessonVideo] = useState<File | null>(null)
    const [uploadingLesson, setUploadingLesson] = useState(false)

    // Live lesson mode
    const [isLiveMode, setIsLiveMode] = useState(false)
    const [livePlatform, setLivePlatform] = useState<"zoom" | "youtube" | "other">("zoom")
    const [liveJoinUrl, setLiveJoinUrl] = useState("")
    const [liveStartAt, setLiveStartAt] = useState("")

    // Upload recording to existing live lesson
    const [uploadRecordingForLesson, setUploadRecordingForLesson] = useState<string | null>(null)
    const [recordingFile, setRecordingFile] = useState<File | null>(null)
    const [uploadingRecording, setUploadingRecording] = useState(false)

    // Notes
    const [selectedLessonForNotes, setSelectedLessonForNotes] = useState<string | null>(null)
    const [notes, setNotes] = useState<Note[]>([])
    const [loadingNotes, setLoadingNotes] = useState(false)
    const [noteTitle, setNoteTitle] = useState("")
    const [noteFile, setNoteFile] = useState<File | null>(null)
    const [uploadingNote, setUploadingNote] = useState(false)

    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")
        if (!storedUser || !token) { router.push("/login"); return }
        try {
            const user = JSON.parse(storedUser)
            if (user.role !== "admin") { router.push("/dashboard"); return }
        } catch { router.push("/login"); return }

        fetchSections()
    }, [batchId, router])

    const fetchSections = async () => {
        try {
            const res = await api.get<Section[]>(`/sections/batch/${batchId}`)
            setSections(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const resetLessonForm = () => {
        setAddLessonToSection(null)
        setLessonTitle("")
        setLessonDescription("")
        setLessonVideo(null)
        setIsLiveMode(false)
        setLivePlatform("zoom")
        setLiveJoinUrl("")
        setLiveStartAt("")
    }

    // ─── Section CRUD ───
    const handleAddSection = async () => {
        if (!newSectionTitle.trim()) return
        setAddingSection(true)
        setError(null)
        setMessage(null)
        try {
            await api.post("/sections", { batchId, title: newSectionTitle })
            setNewSectionTitle("")
            setMessage("Section added!")
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to add section")
        } finally {
            setAddingSection(false)
        }
    }

    const handleUpdateSection = async (sectionId: string) => {
        if (!editSectionTitle.trim()) return
        setError(null)
        setMessage(null)
        try {
            await api.put(`/sections/${sectionId}`, { title: editSectionTitle })
            setEditingSectionId(null)
            setMessage("Section updated!")
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update section")
        }
    }

    const handleDeleteSection = async (sectionId: string) => {
        if (!window.confirm("Delete this section and all its lessons?")) return
        setError(null)
        setMessage(null)
        try {
            await api.delete(`/sections/${sectionId}`)
            setMessage("Section deleted!")
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete section")
        }
    }

    // ─── Lesson CRUD ───
    const handleUploadLesson = async (sectionId: string) => {
        if (!lessonTitle.trim()) return
        setUploadingLesson(true)
        setError(null)
        setMessage(null)

        try {
            if (isLiveMode) {
                // Create live lesson (no file upload)
                if (!liveJoinUrl.trim() || !liveStartAt) {
                    setError("Please fill in the join URL and start time for the live class.")
                    setUploadingLesson(false)
                    return
                }

                await api.post("/lessons/live", {
                    title: lessonTitle,
                    description: lessonDescription,
                    sectionId,
                    livePlatform,
                    liveJoinUrl,
                    liveStartAt,
                })
            } else {
                // Create recorded lesson (with video upload)
                if (!lessonVideo) {
                    setError("Please upload a video file.")
                    setUploadingLesson(false)
                    return
                }

                const videoDuration = await new Promise<number>((resolve) => {
                    const video = document.createElement("video")
                    video.preload = "metadata"
                    video.onloadedmetadata = () => {
                        window.URL.revokeObjectURL(video.src)
                        resolve(video.duration)
                    }
                    video.src = URL.createObjectURL(lessonVideo)
                })

                const data = new FormData()
                data.append("title", lessonTitle)
                data.append("description", lessonDescription)
                data.append("sectionId", sectionId)
                data.append("duration", Math.round(videoDuration).toString())
                data.append("file", lessonVideo)

                await api.post("/lessons", data)
            }

            resetLessonForm()
            setMessage(isLiveMode ? "Live class scheduled!" : "Lesson uploaded!")
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to add lesson")
        } finally {
            setUploadingLesson(false)
        }
    }

    const handleDeleteLesson = async (lessonId: string) => {
        if (!window.confirm("Delete this lesson?")) return
        setError(null)
        setMessage(null)
        try {
            await api.delete(`/lessons/${lessonId}`)
            setMessage("Lesson deleted!")
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete lesson")
        }
    }

    // ─── Upload recording to an existing live lesson ───
    const handleUploadRecording = async (lessonId: string) => {
        if (!recordingFile) return
        setUploadingRecording(true)
        setError(null)
        setMessage(null)
        try {
            const videoDuration = await new Promise<number>((resolve) => {
                const video = document.createElement("video")
                video.preload = "metadata"
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src)
                    resolve(video.duration)
                }
                video.src = URL.createObjectURL(recordingFile)
            })

            const data = new FormData()
            data.append("file", recordingFile)
            data.append("duration", Math.round(videoDuration).toString())

            await api.post(`/lessons/${lessonId}/recording`, data)
            setUploadRecordingForLesson(null)
            setRecordingFile(null)
            setMessage("Recording uploaded!")
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to upload recording")
        } finally {
            setUploadingRecording(false)
        }
    }

    // ─── Update live status ───
    const handleUpdateLiveStatus = async (lessonId: string, newStatus: "scheduled" | "live" | "ended") => {
        setError(null)
        setMessage(null)
        try {
            await api.put(`/lessons/${lessonId}`, { liveStatus: newStatus })
            setMessage(`Status updated to "${newStatus}"`)
            await fetchSections()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update status")
        }
    }

    // ─── Notes ───
    const toggleNotesForLesson = async (lessonId: string) => {
        if (selectedLessonForNotes === lessonId) {
            setSelectedLessonForNotes(null)
            setNotes([])
            return
        }
        setSelectedLessonForNotes(lessonId)
        setLoadingNotes(true)
        try {
            const res = await api.get<Note[]>(`/notes/lesson/${lessonId}`)
            setNotes(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingNotes(false)
        }
    }

    const handleUploadNote = async (lessonId: string) => {
        if (!noteTitle.trim() || !noteFile) return
        setUploadingNote(true)
        setError(null)
        setMessage(null)
        try {
            const data = new FormData()
            data.append("title", noteTitle)
            data.append("lessonId", lessonId)
            data.append("file", noteFile)

            const res = await api.post<Note>("/notes", data)
            setNotes((prev) => [res.data, ...prev])
            setNoteTitle("")
            setNoteFile(null)
            setMessage("Note uploaded!")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to upload note")
        } finally {
            setUploadingNote(false)
        }
    }

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm("Delete this note?")) return
        try {
            await api.delete(`/notes/${noteId}`)
            setNotes((prev) => prev.filter((n) => n._id !== noteId))
            setMessage("Note deleted!")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete note")
        }
    }

    // ─── Helper: format live status label ───
    function liveStatusBadge(lesson: Lesson) {
        if (!lesson.isLiveEnabled) return null
        const status = lesson.liveStatus || "scheduled"
        const hasRecording = !!lesson.videoUrl

        if (hasRecording) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    <VideoIcon className="h-2.5 w-2.5" />
                    Recorded
                </span>
            )
        }

        if (status === "live") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20 uppercase tracking-wider animate-pulse">
                    <Radio className="h-2.5 w-2.5" />
                    Live Now
                </span>
            )
        }

        if (status === "ended") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-semibold text-gray-400 border border-gray-500/20 uppercase tracking-wider">
                    Ended
                </span>
            )
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">
                <Calendar className="h-2.5 w-2.5" />
                Scheduled
            </span>
        )
    }

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
                <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <h1 className="text-lg font-semibold text-white">Manage Batch Content</h1>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
                {error && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
                )}
                {message && (
                    <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>
                )}

                {/* Add Section */}
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">Add Section</h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            className="flex-1 rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. Module 1 — Introduction"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                        />
                        <button
                            onClick={handleAddSection}
                            disabled={addingSection || !newSectionTitle.trim()}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                        >
                            {addingSection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Add
                        </button>
                    </div>
                </div>

                {/* Sections List */}
                {sections.length === 0 ? (
                    <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                        <p className="text-gray-400">No sections yet. Add one above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sections.map((section) => {
                            const isExpanded = expandedSections.has(section._id)
                            const isEditing = editingSectionId === section._id

                            return (
                                <div key={section._id} className="rounded-xl border border-[#272D40] bg-[#181C27] overflow-hidden">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between px-5 py-4">
                                        <button
                                            onClick={() => toggleSection(section._id)}
                                            className="flex items-center gap-3 text-left flex-1"
                                        >
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editSectionTitle}
                                                    onChange={(e) => setEditSectionTitle(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 rounded border border-[#272D40] bg-[#0F1117] px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                                                />
                                            ) : (
                                                <div>
                                                    <h3 className="font-semibold text-white">{section.title}</h3>
                                                    <p className="text-xs text-gray-500">
                                                        {section.lessonCount} lesson{section.lessonCount !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-2 ml-4">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => handleUpdateSection(section._id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                                                        <Save className="h-3 w-3" />
                                                    </button>
                                                    <button onClick={() => setEditingSectionId(null)} className="rounded-lg bg-[#272D40] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#323948]">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingSectionId(section._id); setEditSectionTitle(section.title) }}
                                                        className="rounded-lg bg-[#272D40] p-2 text-gray-400 hover:text-white hover:bg-[#323948]"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSection(section._id)}
                                                        className="rounded-lg bg-red-600/10 p-2 text-red-400 hover:bg-red-600/20"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-[#272D40] bg-[#0F1117]">
                                            {/* Lessons */}
                                            {section.lessons.length > 0 && (
                                                <div>
                                                    {section.lessons.map((lesson, idx) => (
                                                        <div key={lesson._id}>
                                                            <div className="flex items-center justify-between px-5 py-3 border-b border-[#272D40]">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#272D40] text-xs font-semibold text-gray-400">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-medium text-white truncate">{lesson.title}</p>
                                                                            {liveStatusBadge(lesson)}
                                                                        </div>
                                                                        {lesson.description && <p className="text-xs text-gray-500 truncate">{lesson.description}</p>}
                                                                        {/* Live info row */}
                                                                        {lesson.isLiveEnabled && lesson.liveStartAt && (
                                                                            <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                {new Date(lesson.liveStartAt).toLocaleString()}
                                                                                {lesson.livePlatform && (
                                                                                    <span className="ml-1 text-gray-600">• {lesson.livePlatform}</span>
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 ml-4 shrink-0 flex-wrap justify-end">
                                                                    {/* Live status controls */}
                                                                    {lesson.isLiveEnabled && !lesson.videoUrl && (
                                                                        <div className="flex items-center gap-1">
                                                                            {lesson.liveStatus === "scheduled" && (
                                                                                <button
                                                                                    onClick={() => handleUpdateLiveStatus(lesson._id, "live")}
                                                                                    className="rounded-lg bg-red-600/10 px-2.5 py-1.5 text-[10px] font-semibold text-red-400 hover:bg-red-600/20 uppercase tracking-wider"
                                                                                >
                                                                                    Go Live
                                                                                </button>
                                                                            )}
                                                                            {lesson.liveStatus === "live" && (
                                                                                <button
                                                                                    onClick={() => handleUpdateLiveStatus(lesson._id, "ended")}
                                                                                    className="rounded-lg bg-gray-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 hover:bg-gray-500/20 uppercase tracking-wider"
                                                                                >
                                                                                    End
                                                                                </button>
                                                                            )}
                                                                            {/* Upload recording button */}
                                                                            <button
                                                                                onClick={() => setUploadRecordingForLesson(
                                                                                    uploadRecordingForLesson === lesson._id ? null : lesson._id
                                                                                )}
                                                                                className="rounded-lg bg-blue-600/10 px-2.5 py-1.5 text-[10px] font-semibold text-blue-400 hover:bg-blue-600/20 uppercase tracking-wider"
                                                                            >
                                                                                <Upload className="h-3 w-3 inline mr-0.5" />
                                                                                Recording
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {lesson.isLiveEnabled && lesson.liveJoinUrl && (
                                                                        <a
                                                                            href={lesson.liveJoinUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="rounded-lg bg-[#272D40] p-2 text-gray-400 hover:text-white hover:bg-[#323948]"
                                                                        >
                                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                                        </a>
                                                                    )}
                                                                    <button
                                                                        onClick={() => toggleNotesForLesson(lesson._id)}
                                                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selectedLessonForNotes === lesson._id ? "bg-blue-600 text-white" : "bg-[#272D40] text-gray-400 hover:text-white hover:bg-[#323948]"}`}
                                                                    >
                                                                        <FileText className="h-3 w-3" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteLesson(lesson._id)}
                                                                        className="rounded-lg bg-red-600/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-600/20"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Upload recording panel */}
                                                            {uploadRecordingForLesson === lesson._id && (
                                                                <div className="bg-[#181C27] px-5 py-4 space-y-3 border-b border-[#272D40]">
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                                        Upload Recording for &quot;{lesson.title}&quot;
                                                                    </h4>
                                                                    <div className="flex gap-2 items-center flex-wrap">
                                                                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-[#272D40] bg-[#0F1117] px-4 py-3 text-xs text-gray-400 transition-colors hover:border-blue-500/50 flex-1 min-w-[200px]">
                                                                            <Upload className="h-4 w-4" />
                                                                            {recordingFile ? recordingFile.name : "Choose video file"}
                                                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => setRecordingFile(e.target.files?.[0] || null)} />
                                                                        </label>
                                                                        <button
                                                                            onClick={() => handleUploadRecording(lesson._id)}
                                                                            disabled={uploadingRecording || !recordingFile}
                                                                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                                                        >
                                                                            {uploadingRecording ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                                                            Upload
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setUploadRecordingForLesson(null); setRecordingFile(null) }}
                                                                            className="rounded-lg bg-[#272D40] px-3 py-2.5 text-xs font-medium text-white hover:bg-[#323948]"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Notes panel for this lesson */}
                                                            {selectedLessonForNotes === lesson._id && (
                                                                <div className="bg-[#181C27] px-5 py-4 space-y-3 border-b border-[#272D40]">
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                                        Notes for &quot;{lesson.title}&quot;
                                                                    </h4>

                                                                    {/* Upload note form */}
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        <input
                                                                            type="text"
                                                                            className="flex-1 min-w-[150px] rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                                                                            placeholder="Note title"
                                                                            value={noteTitle}
                                                                            onChange={(e) => setNoteTitle(e.target.value)}
                                                                        />
                                                                        <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-[#272D40] bg-[#0F1117] px-3 py-2 text-xs text-gray-400 hover:border-blue-500/50">
                                                                            <Upload className="h-3 w-3" />
                                                                            {noteFile ? noteFile.name.slice(0, 15) : "File"}
                                                                            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden" onChange={(e) => setNoteFile(e.target.files?.[0] || null)} />
                                                                        </label>
                                                                        <button
                                                                            onClick={() => handleUploadNote(lesson._id)}
                                                                            disabled={uploadingNote || !noteTitle.trim() || !noteFile}
                                                                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                                                        >
                                                                            {uploadingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : "Upload"}
                                                                        </button>
                                                                    </div>

                                                                    {/* Existing notes */}
                                                                    {loadingNotes ? (
                                                                        <p className="text-xs text-gray-500">Loading...</p>
                                                                    ) : notes.length === 0 ? (
                                                                        <p className="text-xs text-gray-500">No notes for this lesson.</p>
                                                                    ) : (
                                                                        <div className="space-y-1.5">
                                                                            {notes.map((note) => (
                                                                                <div key={note._id} className="flex items-center justify-between rounded-lg bg-[#0F1117] px-3 py-2">
                                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                                        <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                                                                        <span className="text-xs text-white truncate">{note.title}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                                                                        <button
                                                                                            className="rounded bg-[#272D40] p-1.5 text-gray-400 hover:text-white"
                                                                                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/notes/${note._id}/download`, "_blank")}
                                                                                        >
                                                                                            <Download className="h-3 w-3" />
                                                                                        </button>
                                                                                        <button onClick={() => handleDeleteNote(note._id)} className="rounded bg-red-600/10 p-1.5 text-red-400 hover:bg-red-600/20">
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add Lesson Form */}
                                            {addLessonToSection === section._id ? (
                                                <div className="p-5 space-y-4">
                                                    <h4 className="text-sm font-medium text-gray-300">Add Lesson</h4>

                                                    {/* Toggle: Recorded vs Live */}
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => setIsLiveMode(false)}
                                                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!isLiveMode
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-[#272D40] text-gray-400 hover:text-white"
                                                                }`}
                                                        >
                                                            <VideoIcon className="h-4 w-4" />
                                                            Recorded
                                                        </button>
                                                        <button
                                                            onClick={() => setIsLiveMode(true)}
                                                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isLiveMode
                                                                ? "bg-red-600 text-white"
                                                                : "bg-[#272D40] text-gray-400 hover:text-white"
                                                                }`}
                                                        >
                                                            <Radio className="h-4 w-4" />
                                                            Live Class
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
                                                        placeholder="Lesson title"
                                                        value={lessonTitle}
                                                        onChange={(e) => setLessonTitle(e.target.value)}
                                                    />
                                                    <textarea
                                                        rows={2}
                                                        className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 resize-none"
                                                        placeholder="Description (optional)"
                                                        value={lessonDescription}
                                                        onChange={(e) => setLessonDescription(e.target.value)}
                                                    />

                                                    {isLiveMode ? (
                                                        /* ─── Live class fields ─── */
                                                        <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                                                            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                                                                Live Class Details
                                                            </p>
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                <div>
                                                                    <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                                                                    <select
                                                                        value={livePlatform}
                                                                        onChange={(e) => setLivePlatform(e.target.value as any)}
                                                                        className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                                                                    >
                                                                        <option value="zoom">Zoom</option>
                                                                        <option value="youtube">YouTube Live</option>
                                                                        <option value="other">Other</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-gray-400 mb-1 block">Start Date & Time</label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={liveStartAt}
                                                                        onChange={(e) => setLiveStartAt(e.target.value)}
                                                                        className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-400 mb-1 block">Join URL</label>
                                                                <input
                                                                    type="url"
                                                                    placeholder="https://zoom.us/j/123456789"
                                                                    value={liveJoinUrl}
                                                                    onChange={(e) => setLiveJoinUrl(e.target.value)}
                                                                    className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* ─── Video upload ─── */
                                                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#272D40] bg-[#0F1117] px-4 py-6 text-sm text-gray-400 transition-colors hover:border-blue-500/50">
                                                            <Upload className="h-5 w-5" />
                                                            {lessonVideo ? lessonVideo.name : "Click to upload video file"}
                                                            <input type="file" accept="video/*" className="hidden" onChange={(e) => setLessonVideo(e.target.files?.[0] || null)} />
                                                        </label>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUploadLesson(section._id)}
                                                            disabled={uploadingLesson || !lessonTitle.trim() || (!isLiveMode && !lessonVideo) || (isLiveMode && (!liveJoinUrl.trim() || !liveStartAt))}
                                                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                                        >
                                                            {uploadingLesson ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : isLiveMode ? "Schedule Live Class" : "Upload Lesson"}
                                                        </button>
                                                        <button
                                                            onClick={resetLessonForm}
                                                            className="rounded-lg bg-[#272D40] px-4 py-2 text-sm font-medium text-white hover:bg-[#323948]"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAddLessonToSection(section._id)}
                                                    className="flex w-full items-center justify-center gap-2 px-5 py-3 text-sm text-gray-400 transition-colors hover:bg-[#181C27] hover:text-blue-400"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add Lesson
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
