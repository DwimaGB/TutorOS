import type { Request, Response } from "express"
import { generateToken } from "../utils/generateToken.js"
import { registerUser, loginUser } from "../services/auth.service.js"

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
