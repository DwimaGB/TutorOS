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

import { googleSignIn } from "../services/auth.service.js"

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: "Credential is required" })
    }

    const result = await googleSignIn(credential)
    if (!result) {
      return res.status(400).json({ message: "Google Authentication failed" })
    }

    res.json({
      token: generateToken(result._id.toString()),
      user: result.user,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error during Google Auth" })
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

export const getAdminStatus = async (_req: AuthRequest, res: Response) => {
  try {
    const admin = await User.findOne({ role: "admin" }).select("name email lastSeen")

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const isOnline = admin.lastSeen ? new Date(admin.lastSeen) > fiveMinutesAgo : false

    res.json({
      isOnline,
      lastSeen: admin.lastSeen,
      name: admin.name,
      email: admin.email,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}
