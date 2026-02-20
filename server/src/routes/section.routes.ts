import express from "express"
import {
    createSectionHandler,
    getSectionsByBatchHandler,
    updateSectionHandler,
    deleteSectionHandler,
} from "../controllers/section.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.post("/", protect, authorizeRoles("admin"), createSectionHandler)
router.get("/batch/:batchId", protect, getSectionsByBatchHandler)
router.put("/:sectionId", protect, authorizeRoles("admin"), updateSectionHandler)
router.delete("/:sectionId", protect, authorizeRoles("admin"), deleteSectionHandler)

export default router
