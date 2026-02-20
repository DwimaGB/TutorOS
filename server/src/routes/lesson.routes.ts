import express from "express"
import {
  createLessonHandler,
  getLessonsBySectionHandler,
  updateLessonHandler,
  deleteLessonHandler,
} from "../controllers/lesson.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"
import { uploadVideo } from "../middleware/upload.middleware.js"

const router = express.Router()

router.post("/", protect, authorizeRoles("admin"), uploadVideo.single("file"), createLessonHandler)

router.get("/section/:sectionId", protect, getLessonsBySectionHandler)

router.put("/:lessonId", protect, authorizeRoles("admin"), updateLessonHandler)

router.delete("/:lessonId", protect, authorizeRoles("admin"), deleteLessonHandler)

export default router
