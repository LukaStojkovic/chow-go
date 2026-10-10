import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import Cart from "../models/Cart.js";
import { AppError } from "../utils/AppError.js";
import * as imageService from "./image.service.js";
import { normalizePromotionInput, withPromotion } from "../utils/promotion.js";
import { parseOptionGroupsInput } from "../utils/menuOptions.js";
import { nextSortOrder, resolveSectionInput } from "./menuLayout.service.js";
import mongoose from "mongoose";
import { parsePagination } from "../utils/pagination.js";
import { containsRegex } from "../utils/regex.js";

export async function validateMenuItemInput(name, price, category) {
  if (!name || !price || !category) {
    throw new AppError("Name, price, and category are required", 400);
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    throw new AppError("Price must be a positive number", 400);
  }

  return numericPrice;
}

export async function validateRestaurantOwnership(restaurantId, userId) {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  if (restaurant.ownerId.toString() !== userId.toString()) {
    throw new AppError("Not authorized to modify this restaurant", 403);
  }

  return restaurant;
}

export async function createNewMenuItem({
  restaurantId,
  userId,
  name,
  description,
  price,
  category,
  available,
  imageUrls,
  promotion,
  optionGroups,
  sectionId,
}) {
  await validateRestaurantOwnership(restaurantId, userId);
  const numericPrice = await validateMenuItemInput(name, price, category);
  const groups = parseOptionGroupsInput(optionGroups) ?? [];
  const section = (await resolveSectionInput(restaurantId, sectionId)) ?? null;
  // Validated against the item's own price, so a promotion can never be saved
  // that would sell the dish for less than it is allowed to go for.
  const normalizedPromotion = normalizePromotionInput(promotion, numericPrice);

  const newMenuItem = await MenuItem.create({
    name: name.trim(),
    description: description?.trim() || "",
    price: numericPrice,
    category: category.trim(),
    available: available === true || available === "true",
    imageUrls: imageUrls || [],
    promotion: normalizedPromotion,
    optionGroups: groups,
    sectionId: section,
    sortOrder: await nextSortOrder(restaurantId, section),
    restaurant: restaurantId,
    owner: userId,
  });

  return newMenuItem;
}

export async function getMenuByCategories(restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  const items = await MenuItem.find({
    restaurant: new mongoose.Types.ObjectId(restaurantId),
    available: true,
  })
    .select("name description price available imageUrls promotion optionGroups category sectionId sortOrder createdAt")
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  const now = new Date();
  const priced = (list) =>
    list.map(({ sectionId, sortOrder, createdAt, ...item }) => withPromotion(item, now));

  // The seller's own sections come first, in their order. Anything outside
  // them - every dish, for a restaurant that never set sections up - keeps
  // the category grouping it always had.
  const sectionIds = new Set(restaurant.menuSections.map((section) => String(section._id)));
  const sections = restaurant.menuSections
    .map((section) => ({
      sectionId: String(section._id),
      label: section.name,
      category: section.name,
      items: priced(items.filter((item) => String(item.sectionId) === String(section._id))),
    }))
    .filter((section) => section.items.length > 0);

  const byCategory = new Map();
  for (const item of items) {
    if (item.sectionId && sectionIds.has(String(item.sectionId))) continue;
    const category = item.category || "Uncategorized";
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(item);
  }
  const categories = [...byCategory.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([category, list]) => ({ category, items: priced(list) }));

  return [...sections, ...categories];
}

export async function getAllMenuItems({
  restaurantId,
  page = 1,
  limit = 12,
  search = "",
  category = "",
  minPrice = "",
  maxPrice = "",
  available = "",
}) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit }, { defaultLimit: 12 });

  let query = { restaurant: restaurantId, deletedAt: null };

  const searchRegex = containsRegex(search);
  if (searchRegex) {
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  if (typeof category === "string" && category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (available !== "") {
    query.available = available === "true";
  }

  const [menuItems, totalItems] = await Promise.all([
    MenuItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    MenuItem.countDocuments(query),
  ]);

  return {
    menuItems,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
      limit: limitNum,
      hasNext: pageNum < Math.ceil(totalItems / limitNum),
      hasPrev: pageNum > 1,
    },
  };
}

// The seller's editor used to find a dish by searching the first page of the
// list, so a restaurant with more than one page could not edit the rest.
export async function getOwnMenuItem({ restaurantId, menuItemId }) {
  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
    deletedAt: null,
  }).lean();
  if (!menuItem) throw new AppError("Menu item not found", 404);
  return menuItem;
}

export async function updateMenuItem({
  restaurantId,
  menuItemId,
  userId,
  name,
  description,
  price,
  category,
  available,
  existingImages,
  newFiles,
  promotion,
  optionGroups,
  sectionId,
}) {
  await validateRestaurantOwnership(restaurantId, userId);
  const numericPrice = await validateMenuItemInput(name, price, category);
  const normalizedPromotion = normalizePromotionInput(promotion, numericPrice);
  const groups = parseOptionGroupsInput(optionGroups);
  const section = await resolveSectionInput(restaurantId, sectionId);

  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
    deletedAt: null,
  });

  if (!menuItem) {
    throw new AppError("Menu item not found", 404);
  }

  const { imageUrls, imagesToRemove } = await imageService.replaceImages(
    menuItem.imageUrls,
    existingImages,
    newFiles,
  );

  if (imageUrls.length === 0) {
    throw new AppError("At least one image is required", 400);
  }

  menuItem.name = name.trim();
  menuItem.description = description?.trim() || "";
  menuItem.price = numericPrice;
  menuItem.category = category.trim();
  menuItem.available = available !== "false";
  menuItem.imageUrls = imageUrls;
  // Replaced wholesale rather than merged: the form always submits the whole
  // promotion block, so a merge would make "turn this deal off" impossible.
  menuItem.promotion = normalizedPromotion;
  // Absent means an older client that knows nothing about options; leave them.
  if (groups !== undefined) menuItem.optionGroups = groups;
  if (section !== undefined && String(section) !== String(menuItem.sectionId)) {
    menuItem.sectionId = section;
    menuItem.sortOrder = await nextSortOrder(restaurantId, section);
  }

  await menuItem.save();

  return menuItem;
}

export async function deleteMenuItemById({ restaurantId, menuItemId, userId }) {
  // Ownership first: checking existence first told any seller which ids exist
  // in other restaurants (404 versus 403).
  await validateRestaurantOwnership(restaurantId, userId);

  // Soft delete, and the images stay: past orders still show the dish.
  const menuItem = await MenuItem.findOneAndUpdate(
    { _id: menuItemId, restaurant: restaurantId, deletedAt: null },
    { $set: { deletedAt: new Date(), available: false } },
    { new: true },
  );

  if (!menuItem) {
    throw new AppError("Menu item not found", 404);
  }

  await Cart.updateMany(
    { "items.menuItem": menuItem._id },
    { $pull: { items: { menuItem: menuItem._id } } },
  );

  return true;
}
