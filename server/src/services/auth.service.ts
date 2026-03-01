import User from "../models/user.model.js"
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function registerUser(name: string, email: string, password?: string) {
    const userExists = await User.findOne({ email })
    if (userExists) return null

    const userData: any = { name, email, role: "student" }
    if (password) userData.password = password

    const user = await User.create(userData)
    const { password: _pw, ...safeUser } = user.toObject()
    return { user: safeUser, _id: user._id }
}

export async function loginUser(email: string, password?: string) {
    const user = await User.findOne({ email })
    if (!user) return null

    if (!password) return null

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return null

    const { password: _pw, ...safeUser } = user.toObject()
    return { user: safeUser, _id: user._id }
}

export async function googleSignIn(credential: string) {
    const audience = process.env.GOOGLE_CLIENT_ID || ""
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: audience,
    })

    const payload = ticket.getPayload()
    if (!payload?.email || !payload?.name) {
        throw new Error("Invalid Google token payload")
    }

    const { email, name } = payload

    let user = await User.findOne({ email })

    if (!user) {
        user = await User.create({ name, email, role: "student" })
    }

    const { password: _pw, ...safeUser } = user.toObject()

    return { user: safeUser, _id: user._id }
}
