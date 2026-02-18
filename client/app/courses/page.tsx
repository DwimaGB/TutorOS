"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, LayoutDashboard, LogOut } from "lucide-react"

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  price?: number
  instructor?: { name: string }
}

interface User {
  _id: string
  name: string
  role: "student" | "admin"
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check auth state
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User)
      } catch { /* ignore */ }
    }

    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses")
        setCourses(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Navbar */}
      <header className="border-b border-[#272D40] bg-[#181C27]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
            <span className="font-semibold text-white">TeachHub</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 rounded-lg border border-[#272D40] bg-transparent px-4 py-2 text-sm text-gray-300 transition-colors hover:border-blue-500/50 hover:text-white">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-[#272D40] bg-transparent px-3 py-2 text-sm text-gray-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button className="rounded-lg border border-[#272D40] bg-transparent px-4 py-2 text-sm text-gray-300 transition-colors hover:border-blue-500/50 hover:text-white">
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Explore Courses</h1>
          <p className="mt-2 text-gray-400">
            Browse our collection of courses designed to help you learn and grow.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-gray-600" />
            <p className="text-lg text-gray-400">No courses available yet.</p>
            <p className="mt-1 text-sm text-gray-500">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link href={`/courses/${course._id}`} key={course._id}>
                <div className="group overflow-hidden rounded-xl border border-[#272D40] bg-[#181C27] transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
                  {/* Thumbnail */}
                  {course.thumbnail ? (
                    <div className="relative h-44 w-full">
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#272D40] to-[#1e2330]">
                      <BookOpen className="h-10 w-10 text-gray-600" />
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      {typeof course.price === "number" && (
                        <span className="text-lg font-bold text-white">
                          ₹{course.price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-sm text-blue-500 group-hover:text-blue-400">
                        View Course →
                      </span>
                    </div>
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
