import express from "express"
import {
  createLessonHandler,
  getLessonsHandler,
  updateLessonHandler,
  deleteLessonHandler,
} from "../controllers/lesson.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"
import { uploadVideo } from "../middleware/upload.middleware.js"

const router = express.Router()

// Only admin (single teacher) can create lessons
// `upload.single('file')` handles the video upload and attaches `req.file`
router.post("/", protect, authorizeRoles("admin"), uploadVideo.single("file"), createLessonHandler)

router.get("/:courseId", protect, getLessonsHandler)

router.put("/:lessonId", protect, authorizeRoles("admin"), updateLessonHandler)

router.delete("/:lessonId", protect, authorizeRoles("admin"), deleteLessonHandler)

export default router

