import cloudinary from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../utils/formatData.js";

export async function deleteCloudinaryImage(url) {
  if (!url) return false;

  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", publicId, error);
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

export function filterValidCloudinaryUrls(urls) {
  if (!urls) return [];

  if (Array.isArray(urls)) {
    return urls.filter(
      (url) => typeof url === "string" && url.includes("res.cloudinary.com"),
    );
  }

  if (typeof urls === "string" && urls.includes("res.cloudinary.com")) {
    return [urls];
  }

  return [];
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
    const validUrls = filterValidCloudinaryUrls(existingImages);
    imageUrls = validUrls;
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
