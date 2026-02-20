"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, ArrowRight } from "lucide-react"

interface Batch {
    _id: string
    title: string
    description: string
}

export default function NotesPage() {
    const router = useRouter()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")
        if (!storedUser || !token) { router.push("/login"); return }
        try {
            const user = JSON.parse(storedUser)
            if (user.role !== "admin") { router.push("/dashboard"); return }
        } catch { router.push("/login"); return }

        const fetchBatches = async () => {
            try {
                const res = await api.get<Batch[]>("/batches")
                setBatches(res.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchBatches()
    }, [router])

    if (loading) {
        return <div className="flex items-center justify-center py-20"><p className="text-gray-400">Loading...</p></div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Notes & Materials</h1>
                <p className="mt-1 text-sm text-gray-400">
                    Notes are attached to individual lessons. Select a batch to manage its content and upload notes.
                </p>
            </div>

            {batches.length === 0 ? (
                <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                    <p className="text-gray-400">No batches created yet. Create a batch first.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {batches.map((batch) => (
                        <Link href={`/batches/${batch._id}/manage`} key={batch._id}>
                            <div className="group rounded-xl border border-[#272D40] bg-[#181C27] p-5 transition-all hover:border-blue-500/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{batch.title}</h3>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2">{batch.description}</p>
                                <span className="mt-3 inline-flex items-center gap-1 text-sm text-blue-500">
                                    Manage Content <ArrowRight className="h-3 w-3" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
