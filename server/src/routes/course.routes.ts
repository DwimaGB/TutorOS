import express from "express"
import {
  createCourse,
  getCourses,
  getCourseById,
} from "../controllers/course.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.get("/", getCourses)
router.get("/:id", getCourseById)

router.post("/", protect, authorizeRoles("teacher"), createCourse)

export default router