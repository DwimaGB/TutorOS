import express from "express"
import {
    createBatchHandler,
    getBatchesHandler,
    getBatchByIdHandler,
    updateBatchHandler,
    deleteBatchHandler,
} from "../controllers/batch.controller.js"
import { uploadThumbnail } from "../middleware/upload.middleware.js"
import { protect } from "../middleware/auth.middleware.js"
import { authorizeRoles } from "../middleware/role.middleware.js"

const router = express.Router()

router.get("/", getBatchesHandler)
router.get("/:id", getBatchByIdHandler)

router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    uploadThumbnail.single("thumbnail"),
    createBatchHandler
)

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    updateBatchHandler
)

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteBatchHandler
)

export default router
