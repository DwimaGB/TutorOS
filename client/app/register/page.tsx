"use client"

import { useState } from "react"
import { GoogleLogin } from "@react-oauth/google"
import Link from "next/link"
import type { AxiosError } from "axios"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      await api.post("/auth/register", { ...form })
      setSuccess("Registration successful. Redirecting to sign in...")
      setTimeout(() => {
        router.push("/login")
      }, 600)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }> | undefined
      const status = axiosErr?.response?.status
      const message =
        axiosErr?.response?.data?.message ||
        (status === 400 ? "Please check your details and try again." : null) ||
        "Could not create your account. Please try again."

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F1117] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
          <span className="text-xl font-semibold text-white">TutorOS</span>
        </Link>

        <div className="rounded-xl border border-[#272D40] bg-[#181C27] p-8">
          <h1 className="text-2xl font-semibold text-white">Create an account</h1>
          <p className="mt-1 text-sm text-gray-400">
            Join TutorOS as a student. Courses are managed by the teacher.
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                className="w-full rounded-lg border border-[#272D40] bg-[#0F1117] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#272D40]"></div>
              <span className="flex-shrink-0 px-4 text-xs text-gray-400">OR</span>
              <div className="flex-grow border-t border-[#272D40]"></div>
            </div>
          </form>

          <div className="mt-4 flex justify-center w-full [&>div]:w-full [&>div>div]:w-full">
            <GoogleLogin
              onSuccess={async (credentialResponse: any) => {
                if (!credentialResponse.credential) return
                try {
                  const res = await api.post("/auth/google-login", {
                    credential: credentialResponse.credential,
                  })

                  localStorage.setItem("token", res.data.token)
                  localStorage.setItem("user", JSON.stringify(res.data.user))

                  router.push("/dashboard")
                } catch (err) {
                  console.error(err)
                  setError("Google sign in failed. Please try again.")
                }
              }}
              onError={() => setError("Google Sign In failed.")}
              theme="filled_black"
              size="large"
              width="100%"
            />
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-500 hover:text-blue-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}