import app from "./app.js"
import { connectDB } from "./config/db.js"
import { cloudinary } from "./config/cloudinary.js"

// import { setServers } from "node:dns/promises";
// setServers(["1.1.1.1", "8.8.8.8"]); // Set DNS servers to Cloudflare

const PORT = process.env.PORT || 5000

connectDB()
// console.log("Cloudinary:", cloudinary)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

