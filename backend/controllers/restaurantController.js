import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import { AppError } from "../utils/AppError.js";
import cloudinary from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../utils/formatData.js";
import mongoose from "mongoose";

export async function createMenuItem(req, res, next) {
  const { restaurantId } = req.params;
  const { name, description, price, category, available } = req.body;

  if (!name || !price || !category) {
    return next(new AppError("Name, price, and category are required", 400));
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return next(new AppError("Price must be a positive number", 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return next(
      new AppError("Not authorized to add items to this restaurant", 403)
    );
  }

  const imageUrls = req.files?.map((file) => file.path) || [];

  const newMenuItem = await MenuItem.create({
    name: name.trim(),
    description: description?.trim() || "",
    price: numericPrice,
    category: category.trim(),
    available: available !== "false",
    imageUrls,
    restaurant: restaurantId,
    owner: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: {
      menuItem: newMenuItem,
    },
  });
}

export async function getRestaurantMenuByCategories(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
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

  const menu = menuByCategories.map((group) => ({
    category: group._id || "Uncategorized",
    items: group.items,
  }));

  res.status(200).json({
    status: "success",
    menu,
  });
}

export async function getRestaurantMenuItems(req, res, next) {
  const { restaurantId } = req.params;

  let {
    page = 1,
    limit = 12,
    search = "",
    category = "",
    minPrice = "",
    maxPrice = "",
    available = "",
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return next(new AppError("Restaurant not found", 404));

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

  const menuItems = await MenuItem.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalItems = await MenuItem.countDocuments(query);

  res.status(200).json({
    status: "success",
    data: {
      menuItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        limit,
        hasNext: page < Math.ceil(totalItems / limit),
        hasPrev: page > 1,
      },
    },
  });
}

export async function deleteMenuItem(req, res, next) {
  const { restaurantId, menuItemId } = req.params;

  const menuItem = await MenuItem.findOne({
    _id: menuItemId,
    restaurant: restaurantId,
  });

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to delete this menu item", 403));
  }

  for (const url of menuItem.imageUrls) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(console.error);
    }
  }

  await MenuItem.deleteOne({ _id: menuItemId });

  res.status(200).json({
    status: "success",
    message: "Menu item deleted successfully",
  });
}

export async function getRestaurantInformations(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId).lean();

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: restaurant,
  });
}
