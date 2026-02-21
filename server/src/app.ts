import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.routes.js"
import batchRoutes from "./routes/batch.routes.js"
import sectionRoutes from "./routes/section.routes.js"
import lessonRoutes from "./routes/lesson.routes.js"
import enrollmentRoutes from "./routes/enrollment.routes.js"
import studentRoutes from "./routes/student.routes.js"
import noteRoutes from "./routes/note.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
  })
)

app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/batches", batchRoutes)
app.use("/api/sections", sectionRoutes)
app.use("/api/lessons", lessonRoutes)
app.use("/api/enrollment", enrollmentRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/notes", noteRoutes)
app.use("/api/analytics", analyticsRoutes)

export default app
