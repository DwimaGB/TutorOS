"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!storedUser || !token) {
      router.push("/login")
      return
    }

    try {
      const parsedUser: User = JSON.parse(storedUser)
      if (parsedUser.role !== "admin") {
        router.push("/dashboard")
        return
      }
      setUser(parsedUser)
    } catch (err) {
      console.error("Error parsing user data:", err)
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-4">
            <Link href="/create-course">
              <Button>Create Course</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Stats Cards */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-600">Manage Courses</h3>
            <p className="mt-2 text-3xl font-bold">Courses</p>
            <Link href="/dashboard/courses">
              <Button className="mt-4 w-full" size="sm">
                View Courses
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-600">Create New Course</h3>
            <p className="mt-2 text-lg text-gray-600">Add new courses to the platform</p>
            <Link href="/create-course">
              <Button className="mt-4 w-full" size="sm">
                Create Course
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-600">Manage Lessons</h3>
            <p className="mt-2 text-lg text-gray-600">View and manage course lessons</p>
            <Link href="/dashboard/courses">
              <Button className="mt-4 w-full" size="sm">
                Manage Lessons
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
