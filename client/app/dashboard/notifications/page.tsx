"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import Link from "next/link"
import {
    Bell, Video, FileText, Radio, PlayCircle, CheckCheck,
    Clock, Trash2, BookOpen,
} from "lucide-react"

interface Notification {
    _id: string
    type: "lesson_uploaded" | "note_added" | "live_scheduled" | "live_started" | "recording_uploaded"
    message: string
    batch?: { _id: string; title: string }
    lesson?: string
    read: boolean
    createdAt: string
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    lesson_uploaded: {
        icon: Video,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    note_added: {
        icon: FileText,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    live_scheduled: {
        icon: Clock,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
    },
    live_started: {
        icon: Radio,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
    },
    recording_uploaded: {
        icon: PlayCircle,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
    },
}

export default function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "unread">("all")

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }
        fetchNotifications()
    }, [router, filter])

    const fetchNotifications = async () => {
        try {
            const params = filter === "unread" ? "?unread=true" : ""
            const res = await api.get<{ notifications: Notification[]; unreadCount: number }>(
                `/notifications${params}`
            )
            setNotifications(res.data.notifications)
            setUnreadCount(res.data.unreadCount)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await api.put(`/notifications/${notificationId}/read`)
            setNotifications((prev) =>
                prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
            )
            setUnreadCount((c) => Math.max(0, c - 1))
        } catch (err) {
            console.error(err)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all")
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Bell className="h-6 w-6 text-blue-400" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Stay updated with your enrolled batches
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 rounded-lg border border-[#272D40] bg-[#181C27] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#272D40] hover:text-white"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter("all")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-[#181C27] text-gray-400 border border-[#272D40] hover:text-white"
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter("unread")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "unread"
                        ? "bg-blue-600 text-white"
                        : "bg-[#181C27] text-gray-400 border border-[#272D40] hover:text-white"
                        }`}
                >
                    Unread
                    {unreadCount > 0 && (
                        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notifications list */}
            {notifications.length === 0 ? (
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-12 text-center">
                    <Bell className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                    <p className="text-gray-400 text-lg font-medium">
                        {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        {filter === "unread"
                            ? "You're all caught up!"
                            : "Notifications about your enrolled batches will appear here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => {
                        const config = typeConfig[notification.type] || typeConfig.lesson_uploaded
                        const Icon = config.icon

                        return (
                            <div
                                key={notification._id}
                                className={`group relative rounded-xl border bg-[#181C27] p-4 transition-all hover:bg-[#1e2333] ${notification.read
                                    ? "border-[#272D40] opacity-70"
                                    : `border-[#272D40] ${config.bg}`
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} border ${config.border}`}
                                    >
                                        <Icon className={`h-5 w-5 ${config.color}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium ${notification.read ? "text-gray-400" : "text-white"}`}>
                                            {notification.message}
                                        </p>

                                        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                                            {notification.batch && (
                                                <Link
                                                    href={`/learn/${notification.batch._id}`}
                                                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    <BookOpen className="h-3 w-3" />
                                                    {notification.batch.title}
                                                </Link>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {timeAgo(notification.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!notification.read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification._id)}
                                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-[#272D40] hover:text-blue-400"
                                                title="Mark as read"
                                            >
                                                <CheckCheck className="h-4 w-4" />
                                            </button>
                                        )}

                                        {/* Unread dot */}
                                        {!notification.read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                </div>

                                {/* Live badge for live_started notifications */}
                                {notification.type === "live_started" && !notification.read && (
                                    <div className="mt-3 ml-14">
                                        {notification.batch && (
                                            <Link
                                                href={`/learn/${notification.batch._id}`}
                                                className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
                                            >
                                                <Radio className="h-4 w-4" />
                                                Join Now
                                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
