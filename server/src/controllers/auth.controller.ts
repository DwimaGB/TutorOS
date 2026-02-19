import type { Request, Response } from "express"
import User from "../models/user.model.js"
import { generateToken } from "../utils/generateToken.js"

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })
  if (userExists)
    return res.status(400).json({ message: "User already exists" })

  // All signups from the app are students; admin is managed separately
  const user = await User.create({ name, email, password, role: "student" })

  // Strip password before sending to client
  const { password: _pw, ...safeUser } = user.toObject()

  res.json({
    token: generateToken(user._id.toString()),
    user: safeUser,
  })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user)
    return res.status(400).json({ message: "Invalid credentials" })

  const isMatch = await user.comparePassword(password)
  if (!isMatch)
    return res.status(400).json({ message: "Invalid credentials" })

  // Strip password before sending to client
  const { password: _pw, ...safeUser } = user.toObject()

  res.json({
    token: generateToken(user._id.toString()),
    user: safeUser,
  })
}