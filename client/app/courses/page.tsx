"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface Course {
  _id: string
  title: string
  description: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await api.get("/courses")
      setCourses(res.data)
    }

    fetchCourses()
  }, [])

  return (
    <div>
      <h1>Courses</h1>

      {courses.map((course) => (
        <div key={course._id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  )
}