/**
 * Delivery-size Cloudinary URLs.
 *
 * Uploads are stored as the original file - often a 4000px phone photo - and
 * were served as-is into 300px cards. Cloudinary resizes, re-encodes to WebP
 * or AVIF where the client accepts it, and picks a quality, from parameters
 * placed after `/upload/`. Anything that is not a Cloudinary upload URL
 * (Google avatars, seed data on other hosts, local previews) is returned
 * unchanged.
 */

const UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * @param {string | null | undefined} url
 * @param {{ width?: number, height?: number, crop?: "limit" | "fill" }} [options]
 * @returns {string | null | undefined}
 */
export function cloudinaryUrl(url, { width, height, crop = "limit" } = {}) {
  if (typeof url !== "string") return url;
  const match = url.match(UPLOAD);
  if (!match) return url;

  const parts = ["f_auto", "q_auto", `c_${crop}`];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  if (crop === "fill") parts.push("g_auto");
  return `${match[1]}${parts.join(",")}/${match[2]}`;
}

/**
 * A `srcset` at 1x and 2x of the rendered width, or undefined when the URL
 * cannot be resized.
 *
 * @param {string | null | undefined} url
 * @param {number} width The width the image is rendered at, in CSS pixels.
 */
export function cloudinarySrcSet(url, width) {
  if (typeof url !== "string" || !UPLOAD.test(url)) return undefined;
  return [1, 2].map((scale) => `${cloudinaryUrl(url, { width: width * scale })} ${width * scale}w`).join(", ");
}
