"use client"

import { useState } from "react"
import { api } from "@/lib/api"

export default function CreateCourse() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await api.post("/courses", form)
      alert("Course created")
    } catch (err) {
      console.error(err)
      alert("Error")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Title"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Description"
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <input
        type="number"
        placeholder="Price"
        onChange={(e) =>
          setForm({ ...form, price: Number(e.target.value) })
        }
      />

      <button type="submit">Create</button>
    </form>
  )
}