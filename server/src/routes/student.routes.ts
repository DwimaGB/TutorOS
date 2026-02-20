import express from "express"
import {
    getStudentsHandler,
    getStudentByIdHandler,
    removeStudentFromBatchHandler,
} from "../controllers/student.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.get("/", protect, authorizeRoles("admin"), getStudentsHandler)
router.get("/:studentId", protect, authorizeRoles("admin"), getStudentByIdHandler)
router.delete("/:studentId/batches/:batchId", protect, authorizeRoles("admin"), removeStudentFromBatchHandler)

export default router
