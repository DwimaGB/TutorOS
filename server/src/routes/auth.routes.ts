import { Router } from "express"
import {
  registerUser,
  loginUser,
  getMe,
} from "../controllers/auth.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = Router()

router.get("/", (req, res) => {
  res.json({ message: "Auth API working" })
})

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out" })
})
router.get("/me", protect, getMe)

export default router