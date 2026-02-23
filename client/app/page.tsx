"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect } from "react"

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
}

export default function TutorOSLanding() {
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (storedUser && token) {
      try {
        const user: User = JSON.parse(storedUser)
        if (user.role === "admin" || user.role === "student") {
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Error parsing user data:", err)
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0F1117] text-white">
      {/* Navbar */}
      <header className="border-b border-[#272D40] bg-[#181C27]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
            <span className="font-semibold">TutorOS</span>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold leading-tight"
        >
          Your Personal Tuition Portal
          <br className="hidden md:block" />
          for Classes, Lessons, and Students
        </motion.h1>

        <p className="mt-6 mx-auto max-w-2xl text-lg text-gray-400">
          Organize your tuition batches, lessons, and notes in one place and
          give students a simple portal to access everything.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              Get started
            </Button>
          </Link>

          <Link href="/login">
            <Button
              size="lg"
              className="bg-[#1E2638] border border-[#2A3246] text-white hover:bg-[#26304A]"
            >
              Login
            </Button>
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-14 mx-auto max-w-md rounded-2xl border border-[#272D40] bg-[#151A28] p-3 shadow-xl">
          <div className="flex h-56 rounded-xl bg-[#1E2638] overflow-hidden">

            {/* Sidebar */}
            <div className="w-1/3 border-r border-[#2A3246] p-3 space-y-3">
              <div className="h-6 rounded bg-[#2A3246]" />
              <div className="h-6 rounded bg-[#2A3246]" />
              <div className="h-6 rounded bg-[#2A3246]" />
            </div>

            {/* Content */}
            <div className="flex-1 p-3 space-y-3">
              <div className="h-8 rounded bg-[#2A3246]" />

              <div className="grid grid-cols-2 gap-2">
                <div className="h-14 rounded bg-[#2A3246]" />
                <div className="h-14 rounded bg-[#2A3246]" />
                <div className="h-14 rounded bg-[#2A3246]" />
                <div className="h-14 rounded bg-[#2A3246]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold">
          Everything You Need to Run Your Tuition Classes
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            "Course Management",
            "Notes & Materials",
            "Student Access",
            "Simple Dashboard",
          ].map((feature, i) => (
            <Card
              key={i}
              className="border-[#272D40] bg-[#181C27] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition"
            >
              <CardContent className="p-6">
                <div className="mb-4 h-10 w-10 rounded-lg bg-blue-600/20" />

                <h3 className="font-semibold text-white">{feature}</h3>

                <p className="mt-2 text-sm text-gray-400">
                  Manage and organize your tuition classes, content, and students efficiently.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#272D40] py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} TutorOS. All rights reserved.
      </footer>
    </div>
  )
}
