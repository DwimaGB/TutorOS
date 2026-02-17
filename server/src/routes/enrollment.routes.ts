import express from "express"
import {
  enrollCourse,
  myCourses,
} from "../controllers/enrollment.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/:courseId", protect, enrollCourse)
router.get("/my", protect, myCourses)

export default router