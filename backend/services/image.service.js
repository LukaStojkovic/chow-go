import cloudinary from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../utils/formatData.js";
import { logger } from "../utils/logger.js";

export async function deleteCloudinaryImage(url) {
  if (!url) return false;

  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    logger.error({ err: error, publicId }, "Failed to delete image from Cloudinary");
    return false;
  }
}

export async function deleteMultipleCloudinaryImages(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  await Promise.all(urls.map((url) => deleteCloudinaryImage(url)));
}

export function getUploadedImageUrls(files) {
  return files?.map((file) => file.path) || [];
}

// "Existing" images are ones this document already holds. Accepting any
// Cloudinary URL let a seller adopt another restaurant's image and then delete
// it from the shared account by removing it from their own item.
export function keepExistingImages(oldUrls, submitted) {
  if (submitted === undefined || submitted === null) return [];
  const list = Array.isArray(submitted) ? submitted : [submitted];
  const owned = new Set(oldUrls);
  return [...new Set(list.filter((url) => typeof url === "string" && owned.has(url)))];
}

export function mergeImageUrls(existingUrls, newUrls) {
  const merged = [...existingUrls];
  merged.push(...newUrls);
  return merged;
}

export function identifyRemovedImages(oldUrls, newUrls) {
  return oldUrls.filter((url) => !newUrls.includes(url));
}

export async function replaceImages(oldUrls, existingImages, newFiles) {
  let imageUrls = [];

  if (existingImages !== undefined) {
    imageUrls = keepExistingImages(oldUrls, existingImages);
  }

  if (newFiles && newFiles.length > 0) {
    const newUrls = getUploadedImageUrls(newFiles);
    imageUrls.push(...newUrls);
  }

  if (imageUrls.length === 0) {
    return { imageUrls, imagesToRemove: [] };
  }

  const imagesToRemove = identifyRemovedImages(oldUrls, imageUrls);

  await deleteMultipleCloudinaryImages(imagesToRemove);

  return { imageUrls, imagesToRemove };
}
