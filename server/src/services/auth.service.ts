import User from "../models/user.model.js"

export async function registerUser(name: string, email: string, password: string) {
    const userExists = await User.findOne({ email })
    if (userExists) return null

    const user = await User.create({ name, email, password, role: "student" })
    const { password: _pw, ...safeUser } = user.toObject()
    return { user: safeUser, _id: user._id }
}

export async function loginUser(email: string, password: string) {
    const user = await User.findOne({ email })
    if (!user) return null

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return null

    const { password: _pw, ...safeUser } = user.toObject()
    return { user: safeUser, _id: user._id }
}
