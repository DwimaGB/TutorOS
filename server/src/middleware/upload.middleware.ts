import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { cloudinary } from "../config/cloudinary.js"

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "teachhub/thumbnails",
    allowed_formats: ["jpg", "png", "jpeg"],
  } as any,
})

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "teachhub/videos",
    resource_type: "video",
  } as any,
})

const documentStorage = multer.memoryStorage()

export const uploadThumbnail = multer({ storage: imageStorage as any })
export const uploadVideo = multer({ storage: videoStorage as any })
export const uploadDocument = multer({ storage: documentStorage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB limit for PDFs

