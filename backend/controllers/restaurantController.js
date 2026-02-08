import * as menuItemService from "../services/menuItem.service.js";
import * as restaurantService from "../services/restaurant.service.js";
import * as statsService from "../services/stats.service.js";
import * as imageService from "../services/image.service.js";

export async function createMenuItem(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, category, available } = req.body;

    const imageUrls = imageService.getUploadedImageUrls(req.files);

    const newMenuItem = await menuItemService.createNewMenuItem({
      restaurantId,
      userId: req.user._id,
      name,
      description,
      price,
      category,
      available,
      imageUrls,
    });

    res.status(201).json({
      status: "success",
      data: {
        menuItem: newMenuItem,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantMenuByCategories(req, res, next) {
  try {
    const { restaurantId } = req.params;

    const menu = await menuItemService.getMenuByCategories(restaurantId);

    res.status(200).json({
      status: "success",
      menu,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantMenuItems(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const { page, limit, search, category, minPrice, maxPrice, available } =
      req.query;

    const result = await menuItemService.getAllMenuItems({
      restaurantId,
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      available,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItem(req, res, next) {
  try {
    const { restaurantId, menuItemId } = req.params;

    await menuItemService.deleteMenuItemById({
      restaurantId,
      menuItemId,
      userId: req.user._id,
    });

    res.status(200).json({
      status: "success",
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantInformations(req, res, next) {
  try {
    const { restaurantId } = req.params;

    const restaurant = await restaurantService.getRestaurantById(restaurantId);

    res.status(200).json({
      status: "success",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
}

export async function editMenuItem(req, res, next) {
  try {
    const { restaurantId, menuItemId } = req.params;
    const { name, description, price, category, available, existingImages } =
      req.body;

    const menuItem = await menuItemService.updateMenuItem({
      restaurantId,
      menuItemId,
      userId: req.user._id,
      name,
      description,
      price,
      category,
      available,
      existingImages,
      newFiles: req.files,
    });

    res.status(200).json({
      status: "success",
      data: {
        menuItem,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurant(req, res, next) {
  try {
    const {
      name,
      description,
      phone,
      email,
      openingTime,
      closingTime,
      estimatedDeliveryTime,
      address,
    } = req.body;

    await restaurantService.updateRestaurantInfo({
      userId: req.user._id,
      name,
      description,
      phone,
      email,
      openingTime,
      closingTime,
      estimatedDeliveryTime,
      address,
      profilePictureFile: req.file,
    });

    const updatedUser = await req.user.populate({
      path: "restaurant",
      select: "-__v",
    });

    res.status(200).json({
      status: "success",
      message: "Restaurant updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantStats(req, res, next) {
  try {
    const { restaurantId } = req.params;

    const stats = await statsService.getRestaurantStats(
      restaurantId,
      req.user._id,
    );

    res.json(stats);
  } catch (error) {
    next(error);
  }
}
