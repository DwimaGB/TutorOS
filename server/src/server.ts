import app from "./app.js"
import { connectDB } from "./config/db.js"
import { cloudinary } from "./config/cloudinary.js"
import { ensureTeacherAdmin } from "./utils/ensureTeacherAdmin.js"

if (process.env.NODE_ENV !== "production") {
  const { setServers } = await import("node:dns/promises");
  setServers(["1.1.1.1", "8.8.8.8"]); // Set DNS servers to Cloudflare to fix mongodb connection issue in local development
}

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await connectDB()
    await ensureTeacherAdmin() // Create teacher admin if not exists

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error("Failed to start server:", err)
    process.exit(1)
  }
}

startServer()