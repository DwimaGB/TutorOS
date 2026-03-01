import mongoose, { Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "student" | "admin"
  lastSeen?: Date
  comparePassword(password: string): Promise<boolean>
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) {
    return
  }
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = function (password: string) {
  if (!this.password) return Promise.resolve(false)
  return bcrypt.compare(password, this.password)
}

export default mongoose.model<IUser>("User", userSchema)
