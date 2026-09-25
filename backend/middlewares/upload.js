import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import { deleteMultipleCloudinaryImages } from "../services/image.service.js";
import { logger } from "../utils/logger.js";

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

function uploadedUrls(req) {
  const files = [
    ...(req.file ? [req.file] : []),
    ...(Array.isArray(req.files) ? req.files : Object.values(req.files ?? {}).flat()),
  ];
  return files.map((file) => file?.path).filter(Boolean);
}

// Files stream to Cloudinary before the handler validates anything, so a
// signup that fails on a duplicate email - or one failed on purpose, over and
// over, since /register needs no account - left its images billed forever.
// Whatever the request uploaded is removed when it ends in an error.
export function cleanupUploadsOnFailure(req, res, next) {
  res.on("finish", () => {
    if (res.statusCode < 400) return;
    const urls = uploadedUrls(req);
    if (urls.length === 0) return;
    deleteMultipleCloudinaryImages(urls).catch((error) =>
      logger.error({ err: error }, "Failed to clean up uploads from a failed request"),
    );
  });
  next();
}

export function createUpload(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
  });

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_BYTES,
      files: 6,
      fields: 60,
      fieldSize: 100 * 1024,
    },
  });

  return {
    single: (name) => [cleanupUploadsOnFailure, upload.single(name)],
    array: (name, maxCount) => [cleanupUploadsOnFailure, upload.array(name, maxCount)],
    fields: (spec) => [cleanupUploadsOnFailure, upload.fields(spec)],
  };
}
