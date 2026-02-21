import express from "express"
import {
    enrollBatch,
    myBatches,
    getPendingHandler,
    approveHandler,
    rejectHandler,
} from "../controllers/enrollment.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.post("/:batchId", protect, enrollBatch)
router.get("/my", protect, myBatches)

// Admin-only enrollment management
router.get("/pending", protect, authorizeRoles("admin"), getPendingHandler)
router.put("/:enrollmentId/approve", protect, authorizeRoles("admin"), approveHandler)
router.put("/:enrollmentId/reject", protect, authorizeRoles("admin"), rejectHandler)

export default router