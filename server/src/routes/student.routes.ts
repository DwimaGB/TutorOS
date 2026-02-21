import express from "express"
import {
    getStudentsHandler,
    getStudentByIdHandler,
    removeStudentFromBatchHandler,
    adminEnrollStudentHandler,
    getStudentsByBatchHandler,
} from "../controllers/student.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.get("/", protect, authorizeRoles("admin"), getStudentsHandler)
router.post("/enroll", protect, authorizeRoles("admin"), adminEnrollStudentHandler)
router.get("/batch/:batchId", protect, authorizeRoles("admin"), getStudentsByBatchHandler)
router.get("/:studentId", protect, authorizeRoles("admin"), getStudentByIdHandler)
router.delete("/:studentId/batches/:batchId", protect, authorizeRoles("admin"), removeStudentFromBatchHandler)

export default router
