import express from "express"
import { login, register, logout, getAdminStatus, googleLogin } from "../controllers/auth.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/google-login", googleLogin)
router.post("/logout", protect, logout)
router.get("/admin-status", protect, getAdminStatus)

export default router
