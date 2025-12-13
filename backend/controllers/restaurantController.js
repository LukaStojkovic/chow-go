import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";

export async function createMenuItem(req, res, next) {
  const { restaurantId } = req.params;
  const { name, description, price, category, available, imageUrls } = req.body;

  if (!name || !description || !price || !category) {
    return next(new AppError("Missing required fields", 400));
  }

  if (price <= 0) {
    return next(new AppError("Price must be positive", 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);

  if (restaurant.ownerId.toString() !== req.user._id.toString()) {
    throw new AppError(
      "Not authorized to add menu items to this restaurant",
      403
    );
  }

  const newMenuItem = {
    name: name.trim(),
    description: description.trim(),
    price,
    category: category.trim(),
    available: available ?? true,
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
  };

  restaurant.menuItems.push(newMenuItem);

  await restaurant.save();

  res.status(201).json({
    success: true,
    message: "New menu item added successfully",
    menuItem: newMenuItem,
  });
}
