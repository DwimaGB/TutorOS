import express from "express"
import {
    getOverviewHandler,
    getBatchAnalyticsHandler,
    getStudentAnalyticsHandler,
    getRecentActivityHandler,
    getSingleBatchAnalyticsHandler,
} from "../controllers/analytics.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()


router.use(protect, authorizeRoles("admin"))

router.get("/overview", getOverviewHandler)
router.get("/batches", getBatchAnalyticsHandler)
router.get("/students", getStudentAnalyticsHandler)
router.get("/activity", getRecentActivityHandler)
router.get("/batches/:batchId", getSingleBatchAnalyticsHandler)

export default router
