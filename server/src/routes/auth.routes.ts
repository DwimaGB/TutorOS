import express from "express"
import { login, register, logout, getAdminStatus } from "../controllers/auth.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", protect, logout)
router.get("/admin-status", protect, getAdminStatus)

export default router
