import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.routes.js"
import courseRoutes from "./routes/course.routes.js"
import lessonRoutes from "./routes/lesson.routes.js"
import enrollmentRoutes from "./routes/enrollment.routes.js"

dotenv.config()

const app = express()

const allowedOrigins = [
  "http://localhost:3000",
  "https://teach-hub.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/lessons", lessonRoutes)
app.use("/api/enrollment", enrollmentRoutes)

export default app
