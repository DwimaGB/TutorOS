import User from "../models/user.model.js"

export async function ensureTeacherAdmin() {
  const existingAdmin = await User.findOne({ role: "admin" })
  if (existingAdmin) return

  const name = process.env.TEACHER_NAME || "Teacher"
  const email = process.env.TEACHER_EMAIL
  const password = process.env.TEACHER_PASSWORD

  if (!email || !password) {
    console.warn("TEACHER_EMAIL or TEACHER_PASSWORD not set; skipping admin seeding")
    return
  }

  await User.create({ name, email, password, role: "admin" })
  console.log("Admin teacher user created")
}

