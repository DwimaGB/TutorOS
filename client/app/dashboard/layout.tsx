"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, BookOpen, LogOut, PlusCircle, Settings, Menu, X, Users, FileText, Hourglass, BarChart3, Bell } from "lucide-react"
import { api } from "@/lib/api"

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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
        const parsed = JSON.parse(stored) as User
        setUser(parsed)
      } catch { /* ignore */ }
    }
  }, [router])

  // Poll unread count for students
  useEffect(() => {
    if (!user || user.role === "admin") return

    const fetchCount = async () => {
      try {
        const res = await api.get<{ count: number }>("/notifications/unread-count")
        setUnreadCount(res.data.count)
      } catch { /* ignore */ }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const studentNav = [
    { href: "/dashboard", label: "My Learning", icon: LayoutDashboard },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: "/batches", label: "Browse Batches", icon: BookOpen },
  ]

  const adminNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/students", label: "Manage Students", icon: Users },
    { href: "/dashboard/batches", label: "Manage Batches", icon: Settings },
  ]

  const navItems = user?.role === "admin" ? adminNav : studentNav

  return (
    <div className="flex min-h-screen bg-[#0F1117] flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-[#272D40] bg-[#181C27] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
          <span className="text-lg font-semibold text-white">TeachHub</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile notification bell for students */}
          {user?.role !== "admin" && (
            <Link href="/dashboard/notifications" className="relative p-2 text-gray-300 hover:text-white">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileNavOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-md border border-[#272D40] p-2 text-gray-300 hover:bg-[#272D40] hover:text-white"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="border-b border-[#272D40] bg-[#181C27] px-4 py-3 md:hidden">
          {hydrated && user && (
            <div className="mb-4 rounded-lg bg-[#0F1117] px-4 py-3 border border-[#272D40]">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <p className="text-xs text-gray-500 uppercase tracking-tighter">
                  {user.role}
                </p>
              </div>
            </div>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const badge = (item as any).badge
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-blue-600/10 text-blue-400"
                      : "text-gray-400 hover:bg-[#272D40] hover:text-white"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>
          <div className="mt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#272D40] bg-[#181C27] md:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
          <span className="text-lg font-semibold text-white">TeachHub</span>
        </div>

        {hydrated && user && (
          <div className="mx-4 mb-4 rounded-lg bg-[#0F1117] px-4 py-3 border border-[#272D40]">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-xs text-gray-500 uppercase tracking-tighter">
                {user.role}
              </p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const badge = (item as any).badge
            return (
              <Link href={item.href} key={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-gray-400 hover:bg-[#272D40] hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

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

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
