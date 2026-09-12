import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

// multer's default file size is unlimited, and express.json's 1mb cap does not
// apply to multipart - so without these an authenticated user could stream
// arbitrarily large files straight into a paid Cloudinary account.
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// allowed_formats on the storage runs at Cloudinary, i.e. after the bytes have
// already been uploaded and billed. This rejects at the edge instead.
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
}

export function createUpload(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_BYTES,
      files: 6,
      fields: 60,
      fieldSize: 100 * 1024,
    },
  });
}
