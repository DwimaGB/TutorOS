import type { Request, Response } from "express"
import { generateToken } from "../utils/generateToken.js"
import { registerUser, loginUser } from "../services/auth.service.js"
import type { AuthRequest } from "../middleware/auth.middleware.js"
import User from "../models/user.model.js"

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    const result = await registerUser(name, email, password)
    if (!result) {
      return res.status(400).json({ message: "User already exists" })
    }

    res.json({
      token: generateToken(result._id.toString()),
      user: result.user,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const result = await loginUser(email, password)
    if (!result) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    res.json({
      token: generateToken(result._id.toString()),
      user: result.user,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" })
    }

    const userId = req.user._id.toString()
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    await User.findByIdAndUpdate(userId, { lastSeen: tenMinutesAgo }, { returnDocument: "after" })

    res.json({ message: "Logged out" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}
