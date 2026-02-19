import express from "express"
import {
  createLesson,
  getLessons,
  updateLesson,
  deleteLesson,
} from "../controllers/lesson.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"
import { uploadVideo } from "../middleware/upload.middleware.js"

const router = express.Router()

// Only admin (single teacher) can create lessons
// `upload.single('file')` handles the video upload and attaches `req.file`
router.post("/", protect, authorizeRoles("admin"), uploadVideo.single("file"), createLesson)

router.get("/:courseId", protect, getLessons)

router.put("/:lessonId", protect, authorizeRoles("admin"), updateLesson)

router.delete("/:lessonId", protect, authorizeRoles("admin"), deleteLesson)
export default router
