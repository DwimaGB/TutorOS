"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
}

export default function TeachHubLanding() {
  const router = useRouter()
  const [year, setYear] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setYear(new Date().getFullYear())
    
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    
    if (storedUser && token) {
      try {
        const user: User = JSON.parse(storedUser)
        
        // Redirect based on role
        if (user.role === "admin") {
          router.push("/admin")
        } else if (user.role === "student") {
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Error parsing user data:", err)
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [router])

  return (
    <>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-[#0F1117]">
          <p className="text-white">Loading...</p>
        </div>
      ) : (
        <div className="min-h-screen bg-[#0F1117] text-white">
      {/* Navbar */}
      <header className="border-b border-[#272D40] bg-[#181C27]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
            <span className="font-semibold">TeachHub</span>
          </div>

          <div className="hidden gap-6 text-sm text-gray-300 md:flex">
            <a href="#courses" className="hover:text-white">Courses</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>

          <div className="flex gap-3">
            <Link href="/login">
              <Button className="border border-blue-600 bg-transparent text-white hover:bg-blue-600 hover:text-white">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold md:text-6xl"
        >
          Master Coding with Real‑World Projects
        </motion.h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          Learn MERN stack, DSA, and system design through structured lessons,
          live batches, and industry‑ready projects.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/courses">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Explore Courses
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="border border-blue-600 bg-transparent text-white hover:bg-blue-600 hover:text-white"
            >
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold text-white">Why Choose TeachHub?</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Beginner Friendly",
              desc: "Step‑by‑step guidance designed for absolute beginners.",
            },
            {
              title: "Real Projects",
              desc: "Build production‑ready applications for your portfolio.",
            },
            {
              title: "Lifetime Access",
              desc: "Learn anytime with unlimited course access.",
            },
          ].map((feature, i) => (
            <Card key={i} className="bg-[#181C27] border-[#272D40]">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-gray-300">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold text-white">Popular Courses</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((course) => (
            <Card key={course} className="bg-[#181C27] border-[#272D40]">
              <CardContent className="p-6">
                <div className="h-40 rounded-lg bg-[#272D40]" />

                <h3 className="mt-4 font-semibold text-white">MERN Stack Bootcamp</h3>

                <p className="mt-2 text-sm text-gray-300">
                  Learn MongoDB, Express, React, and Node with real projects.
                </p>

                <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                  View Course
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#181C27] py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white">Simple Pricing</h2>

          <Card className="mx-auto mt-10 max-w-md bg-[#0F1117] border-[#272D40]">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white">Full Access</h3>
              <p className="mt-4 text-4xl font-bold text-white">₹4,999</p>
              <p className="mt-2 text-gray-300">Lifetime access to all courses</p>

              <Button className="mt-6 w-full bg-blue-600 hover:bg-blue-700">
                Enroll Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-semibold text-white">What Students Say</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((t) => (
            <Card key={t} className="bg-[#181C27] border-[#272D40]">
              <CardContent className="p-6">
                <p className="text-gray-300">
                  "This platform helped me gain confidence and build real
                  projects."
                </p>
                <p className="mt-4 font-semibold text-white">— Student</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#181C27] py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold text-white">FAQ</h2>

          <div className="mt-10 space-y-6">
            {[
              {
                q: "Do I need prior coding experience?",
                a: "No, courses start from beginner level.",
              },
              {
                q: "Do I get lifetime access?",
                a: "Yes, once enrolled you have lifetime access.",
              },
              {
                q: "Will I build projects?",
                a: "Yes, projects are included in every course.",
              },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-semibold text-white">{item.q}</h3>
                <p className="mt-2 text-gray-300">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-white">Start Your Coding Journey Today</h2>
        <p className="mt-4 text-gray-300">
          Join thousands of learners building real‑world skills.
        </p>

        <Button size="lg" className="mt-8 bg-blue-600 hover:bg-blue-700">
          Get Started Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#272D40] py-8 text-center text-sm text-gray-400">
        © {year || new Date().getFullYear()} TeachHub. All rights reserved.
      </footer>
        </div>
      )}
    </>
  )
}
