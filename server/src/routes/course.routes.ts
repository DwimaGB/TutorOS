import express from "express"
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js"
import { uploadThumbnail } from "../middleware/upload.middleware.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.get("/", getCourses)
router.get("/:id", getCourseById)

// Only admin (single teacher) can create courses
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadThumbnail.single("thumbnail"),
  createCourse
)

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateCourse
)

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteCourse
)

export default router
