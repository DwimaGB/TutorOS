"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, BookOpen, LogOut, PlusCircle, Settings } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setHydrated(true)
    const token = localStorage.getItem("token")
    const stored = localStorage.getItem("user")

    if (!token) {
      router.push("/login")
      return
    }

    if (stored) {
      try {
        setUser(JSON.parse(stored) as User)
      } catch { /* ignore */ }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const studentNav = [
    { href: "/dashboard", label: "My Learning", icon: LayoutDashboard },
    { href: "/courses", label: "Browse Courses", icon: BookOpen },
  ]

  const adminNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/create-course", label: "Create Course", icon: PlusCircle },
    { href: "/dashboard/courses", label: "Manage Content", icon: Settings },
  ]

  const navItems = user?.role === "admin" ? adminNav : studentNav

  return (
    <div className="flex min-h-screen bg-[#0F1117]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-[#272D40] bg-[#181C27]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
          <span className="text-lg font-semibold text-white">TeachHub</span>
        </div>

        {/* User Info */}
        {hydrated && user && (
          <div className="mx-4 mb-4 rounded-lg bg-[#0F1117] px-4 py-3 border border-[#272D40]">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-xs text-gray-500 uppercase tracking-tighter">{user.role}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link href={item.href} key={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-blue-600/10 text-blue-400"
                      : "text-gray-400 hover:bg-[#272D40] hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
