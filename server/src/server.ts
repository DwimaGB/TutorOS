import app from "./app.js"
import { connectDB } from "./config/db.js"

import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 5000

connectDB()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

