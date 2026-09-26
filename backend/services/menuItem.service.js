import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import Cart from "../models/Cart.js";
import { AppError } from "../utils/AppError.js";
import * as imageService from "./image.service.js";
import { normalizePromotionInput, withPromotion } from "../utils/promotion.js";
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
}) {
  await validateRestaurantOwnership(restaurantId, userId);
  const numericPrice = await validateMenuItemInput(name, price, category);
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

  const menuByCategories = await MenuItem.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        available: true,
      },
    },
    {
      $group: {
        _id: "$category",
        items: {
          $push: {
            _id: "$_id",
            name: "$name",
            description: "$description",
            price: "$price",
            available: "$available",
            imageUrls: "$imageUrls",
            promotion: "$promotion",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const now = new Date();

  return menuByCategories.map((group) => ({
    category: group._id || "Uncategorized",
    items: group.items.map((item) => withPromotion(item, now)),
  }));
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
}) {
  await validateRestaurantOwnership(restaurantId, userId);
  const numericPrice = await validateMenuItemInput(name, price, category);
  const normalizedPromotion = normalizePromotionInput(promotion, numericPrice);

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
