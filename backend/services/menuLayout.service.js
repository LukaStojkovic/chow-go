import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";

export const MENU_LAYOUT_LIMITS = { sections: 30, nameLength: 40 };

const layoutError = (key, params) => new AppError(`errors:menuLayout.${key}`, 400, "MENU_LAYOUT_INVALID", params);
const isObjectId = (value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value) && /^[a-f0-9]{24}$/i.test(value);
const byPlacement = (a, b) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || new Date(a.createdAt) - new Date(b.createdAt);

async function ownRestaurant(userId) {
  const restaurant = await Restaurant.findOne({ ownerId: userId });
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  return restaurant;
}

/** The seller's menu as sections in order, plus the dishes in none of them. */
export async function getMenuLayout(userId) {
  const restaurant = await ownRestaurant(userId);
  const items = await MenuItem.find({ restaurant: restaurant._id, deletedAt: null })
    .select("name price available imageUrls category sectionId sortOrder createdAt")
    .lean();
  items.sort(byPlacement);

  const known = new Set(restaurant.menuSections.map((section) => String(section._id)));
  return {
    sections: restaurant.menuSections.map((section) => ({
      _id: section._id,
      name: section.name,
      items: items.filter((item) => String(item.sectionId) === String(section._id)),
    })),
    unsectioned: items.filter((item) => !item.sectionId || !known.has(String(item.sectionId))),
  };
}

/**
 * Replace the layout in one go: section names and order, and which dishes sit
 * in each, in order. A dish left out of every section goes back to the
 * category grouping. Existing section ids are kept so dishes stay attached.
 */
export async function saveMenuLayout(userId, input) {
  const restaurant = await ownRestaurant(userId);
  const sections = input?.sections;
  if (!Array.isArray(sections)) throw layoutError("invalid");
  if (sections.length > MENU_LAYOUT_LIMITS.sections) {
    throw layoutError("tooManySections", { max: MENU_LAYOUT_LIMITS.sections });
  }

  const existing = new Set(restaurant.menuSections.map((section) => String(section._id)));
  const names = new Set();
  const placed = new Map();
  const planned = sections.map((section, index) => {
    const name = typeof section?.name === "string" ? section.name.trim() : "";
    if (!name || name.length > MENU_LAYOUT_LIMITS.nameLength) {
      throw layoutError("sectionName", { section: index + 1, max: MENU_LAYOUT_LIMITS.nameLength });
    }
    const folded = name.toLocaleLowerCase();
    if (names.has(folded)) throw layoutError("duplicateName", { name });
    names.add(folded);

    let id;
    if (section._id !== undefined && section._id !== null && section._id !== "") {
      if (!existing.has(String(section._id))) throw layoutError("unknownSection");
      id = new mongoose.Types.ObjectId(String(section._id));
    } else {
      id = new mongoose.Types.ObjectId();
    }

    const itemIds = section.itemIds ?? [];
    if (!Array.isArray(itemIds)) throw layoutError("invalid");
    itemIds.forEach((itemId, position) => {
      if (!isObjectId(itemId)) throw layoutError("unknownItem");
      if (placed.has(itemId)) throw layoutError("duplicateItem");
      placed.set(itemId, { sectionId: id, sortOrder: position });
    });

    return { _id: id, name };
  });

  const owned = await MenuItem.countDocuments({
    _id: { $in: [...placed.keys()] },
    restaurant: restaurant._id,
    deletedAt: null,
  });
  if (owned !== placed.size) throw layoutError("unknownItem");

  // Dishes first: if the restaurant write then fails, a dish pointing at a
  // section the restaurant does not list simply shows under its category.
  await MenuItem.bulkWrite([
    ...[...placed].map(([itemId, placement]) => ({
      updateOne: { filter: { _id: itemId, restaurant: restaurant._id }, update: { $set: placement } },
    })),
    {
      updateMany: {
        filter: { restaurant: restaurant._id, _id: { $nin: [...placed.keys()] }, sectionId: { $ne: null } },
        update: { $set: { sectionId: null } },
      },
    },
  ]);

  restaurant.menuSections = planned;
  await restaurant.save();

  return getMenuLayout(userId);
}

/**
 * The section a dish is being saved into, from the item form. `undefined`
 * leaves it alone; empty or "null" takes it out of every section.
 */
export async function resolveSectionInput(restaurantId, sectionId) {
  if (sectionId === undefined) return undefined;
  if (sectionId === null || sectionId === "" || sectionId === "null") return null;
  const restaurant = await Restaurant.findById(restaurantId).select("menuSections").lean();
  const match = restaurant?.menuSections?.find((section) => String(section._id) === String(sectionId));
  if (!match) throw layoutError("unknownSection");
  return match._id;
}

/** The next free place at the end of a section (or of the unsectioned dishes). */
export async function nextSortOrder(restaurantId, sectionId) {
  const last = await MenuItem.findOne({ restaurant: restaurantId, sectionId: sectionId ?? null, deletedAt: null })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();
  return (last?.sortOrder ?? -1) + 1;
}
