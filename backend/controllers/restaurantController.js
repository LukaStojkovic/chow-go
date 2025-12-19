import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import cloudinary from "../utils/cloudinary.js";
import { extractCloudinaryPublicId } from "../utils/formatData.js";

export async function createMenuItem(req, res, next) {
  const { restaurantId } = req.params;
  const { name, description, price, category, available } = req.body;

  if (!name || !price || !category) {
    return next(new AppError("Missing required fields", 400));
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return next(new AppError("Price must be positive", 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    throw new AppError(
      "Not authorized to add menu items to this restaurant",
      403
    );
  }

  const imageUrls = req.files?.map((file) => file.path) || [];

  const newMenuItem = {
    name: name.trim(),
    description: description?.trim(),
    price: Number(price),
    category: category.trim(),
    available: available === "false" ? false : true,
    imageUrls,
  };

  restaurant.menuItems.push(newMenuItem);
  await restaurant.save();

  res.status(201).json({
    status: "success",
    menuItem: newMenuItem,
  });
}

export async function getRestaurantMenuItems(req, res, next) {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  res.status(200).json({
    status: "success",
    menuItems: restaurant.menuItems,
  });
}

export async function deleteMenuItem(req, res, next) {
  const { restaurantId, menuItemId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return next(new AppError("Restaurant not found", 404));
  }

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    return next(
      new AppError(
        "Not authorized to delete menu items from this restaurant",
        403
      )
    );
  }

  const menuItem = restaurant.menuItems.id(menuItemId);

  if (!menuItem) {
    return next(new AppError("Menu item not found", 404));
  }

  for (const url of menuItem.imageUrls) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }

  restaurant.menuItems.pull({ _id: menuItemId });

  await restaurant.save();

  res.status(200).json({
    status: "success",
    message: "Menu item deleted successfully",
  });
}
