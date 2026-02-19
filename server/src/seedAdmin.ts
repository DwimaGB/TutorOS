import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "./models/user.model.js"

if (process.env.NODE_ENV !== "production") {
  const { setServers } = await import("node:dns/promises");
  setServers(["1.1.1.1", "8.8.8.8"]); // Set DNS servers to Cloudflare to fix mongodb connection issue in local development
}

dotenv.config()

const createAdmin = async () => {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not defined")
  }
  await mongoose.connect(mongoUri)

  const existing = await User.findOne({ email: "admin@gmail.com" })

  if (existing) {
    console.log("Admin already exists")
    process.exit()
  }

  await User.create({
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin"
  })

  console.log("Admin created successfully")
  process.exit()
}

createAdmin()