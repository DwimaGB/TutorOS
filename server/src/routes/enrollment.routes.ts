import express from "express"
import { enrollBatch, myBatches } from "../controllers/enrollment.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/:batchId", protect, enrollBatch)
router.get("/my", protect, myBatches)

export default router