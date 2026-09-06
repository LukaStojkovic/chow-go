/**
 * Menu item and menu section adapters.
 */

import { titleCase } from "../format.js";

/** @typedef {import("./types").DishView} DishView */
/** @typedef {import("./types").MenuSectionView} MenuSectionView */

/**
 * Slugify a category name into something usable as a DOM id and scroll anchor.
 * Categories are free text on MenuItem, so "Main Courses" and "main-courses"
 * both have to resolve to the same anchor.
 *
 * @param {string} value
 * @returns {string}
 */
export function categorySlug(value) {
  return String(value || "other")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {Object | null | undefined} raw
 * @returns {DishView | null}
 */
export function toDishView(raw) {
  if (!raw || !raw._id) return null;

  const images = Array.isArray(raw.imageUrls) ? raw.imageUrls.filter(Boolean) : [];
  const restaurant = raw.restaurant && typeof raw.restaurant === "object" ? raw.restaurant : null;

  // Promotions are resolved server-side by `backend/utils/promotion.js`, which
  // decides whether a deal is live and what it leaves the dish costing. This
  // reads that answer rather than re-deciding it: a client and a server that
  // disagree about a price is the one bug a food app cannot ship.
  const basePrice = Number(raw.price) || 0;
  const resolved = Number(raw.promotionalPrice);
  const price = Number.isFinite(resolved) ? resolved : basePrice;
  const percentOff = Number(raw.discountPercent) || 0;
  const isDiscounted = percentOff > 0 && price < basePrice;
  const promoLabel = String(raw.promotion?.label || "").trim();

  return {
    id: String(raw._id),
    name: raw.name || "Menu item",
    description: raw.description || "",
    /** What the dish costs now. Already includes any live promotion. */
    price,
    /** The struck-through price, or `null` when nothing is off. */
    basePrice: isDiscounted ? basePrice : null,
    discountPercent: isDiscounted ? percentOff : 0,
    /** Seller-written copy for the badge ("Weekend deal"), when they set one. */
    promoLabel: isDiscounted && promoLabel ? promoLabel : null,
    category: categorySlug(raw.category),
    categoryLabel: titleCase(raw.category) || "Other",
    image: images[0] || null,
    images,
    // `available` defaults to true on the schema; treat a missing value as
    // available so a partial projection never hides a sellable dish.
    isAvailable: raw.available !== false,
    restaurantId: restaurant?._id ? String(restaurant._id) : raw.restaurant ? String(raw.restaurant) : null,
    restaurantName: restaurant?.name || null,
    restaurantLogo: restaurant?.profilePicture || null,
  };
}

/**
 * @param {unknown} list
 * @returns {DishView[]}
 */
export function toDishViews(list) {
  if (!Array.isArray(list)) return [];
  return list.map(toDishView).filter(Boolean);
}

/**
 * `GET /restaurants/:id/menu` returns `[{ category, items }]`. Normalise it,
 * drop empty sections, and push sections that are entirely sold out to the
 * bottom so the browsable menu stays at the top.
 *
 * @param {unknown} raw
 * @returns {MenuSectionView[]}
 */
export function toMenuSections(raw) {
  if (!Array.isArray(raw)) return [];

  const sections = raw
    .map((group) => {
      const items = toDishViews(group?.items);
      if (items.length === 0) return null;
      return {
        id: categorySlug(group.category),
        label: titleCase(group.category) || "Other",
        items,
        availableCount: items.filter((item) => item.isAvailable).length,
      };
    })
    .filter(Boolean);

  return sections.sort((a, b) => {
    const aSoldOut = a.availableCount === 0;
    const bSoldOut = b.availableCount === 0;
    if (aSoldOut === bSoldOut) return 0;
    return aSoldOut ? 1 : -1;
  });
}

/**
 * Filter a menu by a free-text query, keeping section structure intact.
 *
 * @param {MenuSectionView[]} sections
 * @param {string} query
 * @returns {MenuSectionView[]}
 */
export function filterMenuSections(sections, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return sections;

  return sections
    .map((section) => {
      const items = section.items.filter(
        (item) =>
          item.name.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle),
      );
      if (items.length === 0) return null;
      return { ...section, items, availableCount: items.filter((i) => i.isAvailable).length };
    })
    .filter(Boolean);
}

/**
 * The cart API returns lines as `{ menuItem, name, price, quantity }` where
 * `menuItem` is sometimes populated and sometimes just an id, and carries
 * `_id` in some responses and `id` in others.
 *
 * @param {unknown} items
 * @returns {import("./types").BasketLineView[]}
 */
export function toBasketLines(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((line) => {
      const menuItem = line?.menuItem;
      const id = menuItem?._id || menuItem?.id || menuItem;
      if (!id) return null;

      const unitPrice = Number(line.price) || 0;
      const quantity = Number(line.quantity) || 0;
      // Recorded by the cart only when the line was added at a promoted price,
      // so the basket can show the saving without re-reading the menu item -
      // whose promotion may since have ended.
      const baseUnitPrice = Number(line.basePrice) || 0;
      const isDiscounted = baseUnitPrice > unitPrice;

      return {
        id: String(id),
        name: line.name || menuItem?.name || "Item",
        description: menuItem?.description || line.description || "",
        unitPrice,
        baseUnitPrice: isDiscounted ? baseUnitPrice : null,
        savings: isDiscounted
          ? Math.round(((baseUnitPrice - unitPrice) * quantity + Number.EPSILON) * 100) / 100
          : 0,
        quantity,
        lineTotal: Math.round((unitPrice * quantity + Number.EPSILON) * 100) / 100,
        image: menuItem?.imageUrls?.[0] || null,
        notes: line.specialInstructions || null,
      };
    })
    .filter(Boolean);
}
