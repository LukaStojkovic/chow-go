import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { withPromotion } from "../utils/promotion.js";
import { orderingBlockedError } from "../utils/restaurantAvailability.js";
import { createSharedCache } from "../utils/sharedCache.js";

export const UPSELL_LIMITS = {
  total: 6,
  together: 4,
  minSharedOrders: 2,
  recentOrders: 500,
  windowDays: 90,
};

const GAP_CATEGORIES = [
  { key: "drink", reason: "drink" },
  { key: "dessert", reason: "dessert" },
];

// Categories are free text on older menus ("drink", "Drinks", "desserts"), so
// they are compared case-insensitively and without a plural s.
const categoryKey = (category) => String(category ?? "").trim().toLowerCase().replace(/s$/, "");

const statsCache = createSharedCache({ name: "upsell", ttlMs: 10 * 60 * 1000, maxEntries: 1000 });

/**
 * How often each dish sold, and how often each pair sold in the same order,
 * over the restaurant's recent delivered orders.
 */
async function orderStats(restaurantId) {
  const key = String(restaurantId);
  const cached = await statsCache.get(key);
  if (cached) return cached;

  const orders = await Order.find({
    restaurant: restaurantId,
    status: "delivered",
    createdAt: { $gte: new Date(Date.now() - UPSELL_LIMITS.windowDays * 24 * 60 * 60 * 1000) },
  })
    .sort({ createdAt: -1 })
    .limit(UPSELL_LIMITS.recentOrders)
    .select("items.menuItem")
    .lean();

  const popularity = {};
  const pairs = {};
  for (const order of orders) {
    const dishes = [...new Set(order.items.map((item) => String(item.menuItem)))];
    for (const dish of dishes) {
      popularity[dish] = (popularity[dish] ?? 0) + 1;
      for (const other of dishes) {
        if (other === dish) continue;
        pairs[dish] ??= {};
        pairs[dish][other] = (pairs[dish][other] ?? 0) + 1;
      }
    }
  }

  const stats = { popularity, pairs };
  await statsCache.set(key, stats);
  return stats;
}

/**
 * Dishes to offer next to the basket: ones often ordered with what is in it,
 * then a drink and a dessert when the basket has neither. Nothing for a
 * restaurant that cannot take the order.
 */
export async function suggestionsForCart(userId) {
  const cart = await Cart.findOne({ user: userId }).select("restaurant items.menuItem").lean();
  if (!cart?.items?.length) return [];

  const restaurant = await Restaurant.findById(cart.restaurant)
    .select("isActive isOpenNow approvalStatus currency schedule timezone")
    .lean();
  if (orderingBlockedError(restaurant, { allowScheduled: true })) return [];

  const menu = await MenuItem.find({
    restaurant: new mongoose.Types.ObjectId(String(cart.restaurant)),
    available: true,
    deletedAt: null,
  })
    .select("name description price available imageUrls promotion optionGroups category sortOrder restaurant")
    .lean();

  const inCart = new Set(cart.items.map((item) => String(item.menuItem)));
  const cartCategories = new Set(
    menu.filter((dish) => inCart.has(String(dish._id))).map((dish) => categoryKey(dish.category)),
  );
  const candidates = menu.filter((dish) => !inCart.has(String(dish._id)));
  const { popularity, pairs } = await orderStats(cart.restaurant);
  const popularityOf = (dish) => popularity[String(dish._id)] ?? 0;

  const together = candidates
    .map((dish) => ({
      dish,
      shared: [...inCart].reduce((sum, id) => sum + (pairs[id]?.[String(dish._id)] ?? 0), 0),
    }))
    .filter(({ shared }) => shared >= UPSELL_LIMITS.minSharedOrders)
    .sort((a, b) => b.shared - a.shared || popularityOf(b.dish) - popularityOf(a.dish))
    .slice(0, UPSELL_LIMITS.together)
    .map(({ dish }) => ({ dish, reason: "together" }));

  const picked = new Set(together.map(({ dish }) => String(dish._id)));
  const covered = new Set([...cartCategories, ...together.map(({ dish }) => categoryKey(dish.category))]);
  const byPopularity = (a, b) => popularityOf(b) - popularityOf(a) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  const gaps = [];
  for (const { key, reason } of GAP_CATEGORIES) {
    if (covered.has(key)) continue;
    const best = candidates
      .filter((dish) => categoryKey(dish.category) === key && !picked.has(String(dish._id)))
      .sort(byPopularity)[0];
    if (best) {
      picked.add(String(best._id));
      gaps.push({ dish: best, reason });
    }
  }

  // A young restaurant has no pairings yet and often no drinks or desserts;
  // the rest of the menu, best sellers first, still beats an empty rail.
  const popular = candidates
    .filter((dish) => !picked.has(String(dish._id)))
    .sort(byPopularity)
    .slice(0, Math.max(0, UPSELL_LIMITS.total - together.length - gaps.length))
    .map((dish) => ({ dish, reason: "popular" }));

  const now = new Date();
  return [...together, ...gaps, ...popular].slice(0, UPSELL_LIMITS.total).map(({ dish, reason }) => ({
    ...withPromotion({ ...dish, currency: restaurant.currency }, now),
    reason,
  }));
}
