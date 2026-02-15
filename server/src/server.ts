import app from "./app.js"
import mongoose from "mongoose"
import dotenv from "dotenv"

import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config()

mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log("DB Connected"))
  .catch(err => console.error(err))

  
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
