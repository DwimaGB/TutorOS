import express from "express"
import {
  createCourseHandler,
  getCoursesHandler,
  getCourseByIdHandler,
  updateCourseHandler,
  deleteCourseHandler,
} from "../controllers/course.controller.js"
import { uploadThumbnail } from "../middleware/upload.middleware.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.get("/", getCoursesHandler)
router.get("/:id", getCourseByIdHandler)

// Only admin (single teacher) can create courses
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadThumbnail.single("thumbnail"),
  createCourseHandler
)

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateCourseHandler
)

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteCourseHandler
)

export default router

