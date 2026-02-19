import express from "express"
import {
  enrollCourse,
  myCourses,
} from "../controllers/enrollment.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

// GET /my must come before /:courseId so "my" isn't treated as a courseId
router.get("/my", protect, myCourses)
router.post("/:courseId", protect, enrollCourse)

export default router