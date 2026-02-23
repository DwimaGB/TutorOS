"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"
import { BookOpen } from "lucide-react"

interface Batch {
  _id: string
  title: string
  description: string
  thumbnail?: string
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get<Batch[]>("/batches")
        setBatches(res.data)
      } catch (err) {
        console.error(err)
        setError("Failed to load batches. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F1117]">
        <p className="text-gray-400">Loading batches...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      <header className="border-b border-[#272D40] bg-[#181C27]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
            <span className="font-semibold text-white">TutorOS</span>
          </div>
          <Link href="/dashboard">
            <button className="rounded-lg border border-[#272D40] px-4 py-2 text-sm text-gray-300 transition-colors hover:border-blue-500/50 hover:text-white">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Available Batches</h1>
            <p className="mt-1 text-sm text-gray-400">
              Browse all live batches and enroll from your dashboard.
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {batches.length === 0 ? (
          <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <p className="text-gray-400">No batches are available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <Link href={`/batches/${batch._id}`} key={batch._id}>
                <div className="group h-full cursor-pointer overflow-hidden rounded-xl border border-[#272D40] bg-[#181C27] transition-colors hover:border-blue-500/40">
                  {batch.thumbnail ? (
                    <div className="relative h-40 w-full">
                      <Image
                        src={batch.thumbnail}
                        alt={batch.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-[#272D40]" />
                  )}
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-white group-hover:text-blue-400">
                      {batch.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-400">
                      {batch.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

