"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-6">
        <h2 className="text-xl font-bold mb-6">TeachHub</h2>

        <nav className="space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="block w-full text-left"
          >
            Dashboard
          </button>

          <button
            onClick={() => router.push("/dashboard/courses")}
            className="block w-full text-left"
          >
            Courses
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-10 bg-red-500 px-3 py-2 w-full"
        >
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  )
}