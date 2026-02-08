import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import * as imageService from "./image.service.js";
import mongoose from "mongoose";

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
}) {
  await validateRestaurantOwnership(restaurantId, userId);
  const numericPrice = await validateMenuItemInput(name, price, category);

  const newMenuItem = await MenuItem.create({
    name: name.trim(),
    description: description?.trim() || "",
    price: numericPrice,
    category: category.trim(),
    available: available !== "false",
    imageUrls: imageUrls || [],
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
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return menuByCategories.map((group) => ({
    category: group._id || "Uncategorized",
    items: group.items,
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

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  let query = { restaurant: restaurantId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
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
}) {
  await validateRestaurantOwnership(restaurantId, userId);
  const numericPrice = await validateMenuItemInput(name, price, category);

  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
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

  await menuItem.save();

  return menuItem;
}

export async function deleteMenuItemById({ restaurantId, menuItemId, userId }) {
  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
  });

  if (!menuItem) {
    throw new AppError("Menu item not found", 404);
  }

  await validateRestaurantOwnership(restaurantId, userId);

  await imageService.deleteMultipleCloudinaryImages(menuItem.imageUrls);

  await MenuItem.deleteOne({ _id: menuItemId });

  return true;
}
