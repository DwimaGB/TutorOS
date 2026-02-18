"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, Loader2 } from "lucide-react"

export default function CreateCourse() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (!storedUser || !token) {
      router.push("/login")
      return
    }
    try {
      const user = JSON.parse(storedUser)
      if (user.role !== "admin") {
        router.push("/dashboard")
      }
    } catch {
      router.push("/login")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append("title", title)
      data.append("description", description)
      data.append("price", price)

      if (file) {
        data.append("thumbnail", file)
      }

      await api.post("/courses", data)
      setSuccess("Course created successfully!")
      setTitle("")
      setDescription("")
      setPrice("")
      setFile(null)

      setTimeout(() => router.push("/dashboard"), 1200)
    } catch (err) {
      console.error(err)
      setError("Failed to create course. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Header */}
      <header className="border-b border-[#272D40] bg-[#181C27]">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-lg font-semibold text-white">Create New Course</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8">
          {error && (
            <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Course Title
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Complete JavaScript Masterclass"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Description
              </label>
              <textarea
                required
                rows={4}
                className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Describe what students will learn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Price (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="4999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Thumbnail Image
              </label>
              <label
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#272D40] bg-[#0F1117] px-4 py-8 text-sm text-gray-400 transition-colors hover:border-blue-500/50 hover:text-gray-300"
              >
                <Upload className="h-5 w-5" />
                {file ? file.name : "Click to upload thumbnail (JPG, PNG)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
