import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import * as imageService from "./image.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getRestaurantById(restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId).lean();

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return restaurant;
}

export async function updateRestaurantInfo({
  userId,
  name,
  description,
  phone,
  email,
  openingTime,
  closingTime,
  estimatedDeliveryTime,
  address,
  profilePictureFile,
}) {
  const restaurant = await Restaurant.findOne({ ownerId: userId });

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  // Handle profile picture
  if (profilePictureFile) {
    if (restaurant.profilePicture) {
      await imageService.deleteCloudinaryImage(restaurant.profilePicture);
    }
    restaurant.profilePicture = profilePictureFile.path;
  }

  // Update basic info
  if (name !== undefined && name.trim()) {
    restaurant.name = name.trim();
  }

  if (description !== undefined) {
    restaurant.description = description.trim();
  }

  if (phone !== undefined) {
    restaurant.phone = phone.trim();
  }

  if (email !== undefined && email.trim()) {
    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", 400);
    }
    restaurant.email = email.trim();
  }

  if (openingTime !== undefined) {
    restaurant.openingTime = openingTime;
  }

  if (closingTime !== undefined) {
    restaurant.closingTime = closingTime;
  }

  if (estimatedDeliveryTime !== undefined) {
    restaurant.estimatedDeliveryTime = estimatedDeliveryTime.trim();
  }

  // Update address
  if (address) {
    if (!restaurant.address) {
      restaurant.address = {};
    }

    if (address.street !== undefined) {
      restaurant.address.street = address.street.trim();
    }
    if (address.city !== undefined) {
      restaurant.address.city = address.city.trim();
    }
    if (address.state !== undefined) {
      restaurant.address.state = address.state.trim();
    }
    if (address.zipCode !== undefined) {
      restaurant.address.zipCode = address.zipCode.trim();
    }
    if (address.country !== undefined) {
      restaurant.address.country = address.country.trim();
    }
  }

  await restaurant.save();

  return restaurant;
}
