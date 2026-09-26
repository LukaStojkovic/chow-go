import fs from "fs/promises";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { logger } from "../utils/logger.js";

/**
 * Per-restaurant link previews for the SPA.
 *
 * WhatsApp, Viber, Facebook and Google read a shared link's HTML without
 * running any JavaScript, so every /restaurant/:id link previewed as the
 * generic homepage. In production this rewrites the title, description and
 * Open Graph tags in index.html before sending it; the app then boots as
 * usual. Anything that goes wrong falls back to the untouched page.
 */

let cachedIndex = null;

async function readIndex(indexPath) {
  if (!cachedIndex) cachedIndex = await fs.readFile(indexPath, "utf8");
  return cachedIndex;
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function setMeta(html, attribute, key, content) {
  const tag = new RegExp(`<meta\\s+${attribute}="${key}"[\\s\\S]*?/>`);
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return tag.test(html)
    ? html.replace(tag, replacement)
    : html.replace("</head>", `    ${replacement}\n  </head>`);
}

export function renderRestaurantMeta(html, restaurant, pageUrl) {
  const title = `${restaurant.name} - Chow & Go`;
  const description =
    (restaurant.description || "").trim().slice(0, 200) ||
    `Order from ${restaurant.name} on Chow & Go.`;
  const image = restaurant.images?.[0] || restaurant.profilePicture;

  let page = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  page = setMeta(page, "name", "description", description);
  page = setMeta(page, "property", "og:type", "restaurant");
  page = setMeta(page, "property", "og:title", title);
  page = setMeta(page, "property", "og:description", description);
  page = setMeta(page, "property", "og:url", pageUrl);
  if (image) {
    page = setMeta(page, "property", "og:image", cloudinaryUrl(image, { width: 1200, height: 630, crop: "fill" }));
    page = setMeta(page, "name", "twitter:card", "summary_large_image");
  }
  return page;
}

export function restaurantPreviewPage(indexPath) {
  return async (req, res) => {
    const { restaurantId } = req.params;
    try {
      const html = await readIndex(indexPath);
      const restaurant = mongoose.Types.ObjectId.isValid(restaurantId)
        ? await Restaurant.findOne({ _id: restaurantId, isActive: true })
            .select("name description images profilePicture")
            .lean()
        : null;
      if (!restaurant) return res.sendFile(indexPath);

      const base = (process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      res.set("Cache-Control", "public, max-age=300");
      return res.type("html").send(renderRestaurantMeta(html, restaurant, `${base}/restaurant/${restaurantId}`));
    } catch (error) {
      logger.warn({ err: error, restaurantId }, "Restaurant preview fell back to the plain page");
      return res.sendFile(indexPath);
    }
  };
}
