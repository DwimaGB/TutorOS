import express from "express"
import {
    createNoteHandler,
    getNotesByLessonHandler,
    deleteNoteHandler,
} from "../controllers/note.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"
import { uploadDocument } from "../middleware/upload.middleware.js"

const router = express.Router()

router.post("/", protect, authorizeRoles("admin"), uploadDocument.single("file"), createNoteHandler)
router.get("/lesson/:lessonId", protect, getNotesByLessonHandler)
router.delete("/:noteId", protect, authorizeRoles("admin"), deleteNoteHandler)

export default router
