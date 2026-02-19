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
  description?: string
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [savingCourse, setSavingCourse] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonDescription, setEditLessonDescription] = useState("")
  const [savingLesson, setSavingLesson] = useState(false)

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
      setErrorMessage(null)
      setEnrollMessage(null)
      setEnrollingFor(courseId)
      await api.post(`/enrollment/${courseId}`)
      setEnrollMessage("Enrolled successfully! Check your dashboard for My Courses.")
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const message =
        axiosErr?.response?.data?.message ||
        "Could not enroll in this course. Please try again."
      setErrorMessage(message)
    } finally {
      setEnrollingFor(null)
    }
  }

  const startEditCourse = (course: Course) => {
    setEditingCourseId(course._id)
    setEditTitle(course.title)
    setEditDescription(course.description)
    setEditPrice(typeof course.price === "number" ? String(course.price) : "")
  }

  const cancelEditCourse = () => {
    setEditingCourseId(null)
    setEditTitle("")
    setEditDescription("")
    setEditPrice("")
  }

  const handleUpdateCourse = async () => {
    if (!editingCourseId) return
    try {
      setSavingCourse(true)
      setErrorMessage(null)
      setEnrollMessage(null)
      const body: { title: string; description: string; price?: number } = {
        title: editTitle,
        description: editDescription,
      }
      if (editPrice.trim()) {
        body.price = Number(editPrice)
      }
      const res = await api.put<Course>(`/courses/${editingCourseId}`, body)
      const updated = res.data
      setCourses((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c))
      )
      setEnrollMessage("Course updated successfully.")
      cancelEditCourse()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const message =
        axiosErr?.response?.data?.message ||
        "Could not update course. Please try again."
      setErrorMessage(message)
    } finally {
      setSavingCourse(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course and its lessons?"
    )
    if (!confirmed) return
    try {
      setErrorMessage(null)
      setEnrollMessage(null)
      await api.delete(`/courses/${courseId}`)
      setCourses((prev) => prev.filter((c) => c._id !== courseId))
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null)
        setLessons([])
      }
      setEnrollMessage("Course deleted successfully.")
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const message =
        axiosErr?.response?.data?.message ||
        "Could not delete course. Please try again."
      setErrorMessage(message)
    }
  }

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson._id)
    setEditLessonTitle(lesson.title)
    setEditLessonDescription(lesson.description || "")
  }

  const cancelEditLesson = () => {
    setEditingLessonId(null)
    setEditLessonTitle("")
    setEditLessonDescription("")
  }

  const handleUpdateLesson = async () => {
    if (!editingLessonId) return
    try {
      setSavingLesson(true)
      setErrorMessage(null)
      setEnrollMessage(null)
      const body = {
        title: editLessonTitle,
        description: editLessonDescription,
      }
      const res = await api.put<Lesson>(`/lessons/${editingLessonId}`, body)
      const updated = res.data
      setLessons((prev) =>
        prev.map((l) => (l._id === updated._id ? updated : l))
      )
      setEnrollMessage("Lesson updated successfully.")
      cancelEditLesson()
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const message =
        axiosErr?.response?.data?.message ||
        "Could not update lesson. Please try again."
      setErrorMessage(message)
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    )
    if (!confirmed) return
    try {
      setErrorMessage(null)
      setEnrollMessage(null)
      await api.delete(`/lessons/${lessonId}`)
      setLessons((prev) => prev.filter((l) => l._id !== lessonId))
      setEnrollMessage("Lesson deleted successfully.")
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const message =
        axiosErr?.response?.data?.message ||
        "Could not delete lesson. Please try again."
      setErrorMessage(message)
    }
  }

  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">All Courses</h1>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </p>
      )}
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
                  <>
                    <Link href={`/courses/${course._id}/add-lesson`}>
                      <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                        <Plus className="h-3.5 w-3.5" />
                        Add Lesson
                      </button>
                    </Link>
                    <button
                      onClick={() => startEditCourse(course)}
                      className="rounded-lg bg-[#272D40] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#323948]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {isAdmin && editingCourseId === course._id && (
                <div className="mt-3 space-y-3 rounded-lg border border-[#272D40] bg-[#0F1117] p-3">
                  <div>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Course title"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Course description"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="Price (optional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateCourse}
                      disabled={savingCourse}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingCourse ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditCourse}
                      className="rounded-lg bg-[#272D40] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#323948]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Lessons List */}
              {selectedCourseId === course._id && lessons.length > 0 && (
                <div className="space-y-2 border-t border-[#272D40] pt-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    Lessons ({lessons.length})
                  </h3>
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson._id}
                      className="space-y-2 rounded-lg bg-[#0F1117] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#272D40] text-xs font-semibold text-gray-400">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {lesson.title}
                          </p>
                          {lesson.description && (
                            <p className="text-xs text-gray-400">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isAdmin && editingLessonId === lesson._id && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={editLessonTitle}
                            onChange={(e) => setEditLessonTitle(e.target.value)}
                            placeholder="Lesson title"
                          />
                          <textarea
                            rows={2}
                            className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                            value={editLessonDescription}
                            onChange={(e) =>
                              setEditLessonDescription(e.target.value)
                            }
                            placeholder="Lesson description"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateLesson}
                              disabled={savingLesson}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                            >
                              {savingLesson ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditLesson}
                              className="rounded-lg bg-[#272D40] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#323948]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {isAdmin && editingLessonId !== lesson._id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditLesson(lesson)}
                            className="rounded-lg bg-[#272D40] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#323948]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson._id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
