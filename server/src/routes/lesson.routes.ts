import express from "express"
import {
  createLessonHandler,
  createLiveLessonHandler,
  getLessonsBySectionHandler,
  updateLessonHandler,
  deleteLessonHandler,
  uploadRecordingHandler,
} from "../controllers/lesson.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"
import { uploadVideo } from "../middleware/upload.middleware.js"

const router = express.Router()

// Create a recorded lesson (with video upload)
router.post("/", protect, authorizeRoles("admin"), uploadVideo.single("file"), createLessonHandler)

// Create a live-class lesson (no video upload, just JSON body)
router.post("/live", protect, authorizeRoles("admin"), createLiveLessonHandler)

// Upload a recording to an existing lesson (e.g. after live class ends)
router.post("/:lessonId/recording", protect, authorizeRoles("admin"), uploadVideo.single("file"), uploadRecordingHandler)

router.get("/section/:sectionId", protect, getLessonsBySectionHandler)

router.put("/:lessonId", protect, authorizeRoles("admin"), updateLessonHandler)

router.delete("/:lessonId", protect, authorizeRoles("admin"), deleteLessonHandler)

export default router
