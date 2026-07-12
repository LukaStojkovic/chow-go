import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";

export async function rateOrderOperation({
  orderId,
  customerUserId,
  restaurantRating,
  restaurantReview,
  courierRating,
  courierReview,
}) {
  const order = await Order.findOne({
    _id: orderId,
    customer: customerUserId,
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "delivered") {
    throw new AppError("You can only review delivered orders", 400);
  }

  const updates = {};
  if (restaurantRating) {
    const rRating = Number(restaurantRating);
    if (!Number.isInteger(rRating) || rRating < 1 || rRating > 5) {
      throw new AppError("Restaurant rating must be an integer between 1 and 5", 400);
    }
    const rReview = typeof restaurantReview === "string" ? restaurantReview.trim() : "";
    if (rReview.length > 500) throw new AppError("Review must be 500 chars or less", 400);
    
    if (order.customerRating?.restaurantRating) {
      throw new AppError("You have already reviewed this restaurant", 400);
    }
    updates.restaurantRating = rRating;
    updates.restaurantReview = rReview || undefined;
  }

  if (courierRating) {
    const cRating = Number(courierRating);
    if (!Number.isInteger(cRating) || cRating < 1 || cRating > 5) {
      throw new AppError("Courier rating must be an integer between 1 and 5", 400);
    }
    const cReview = typeof courierReview === "string" ? courierReview.trim() : "";
    if (cReview.length > 500) throw new AppError("Review must be 500 chars or less", 400);
    
    if (order.customerRating?.courierRating) {
      throw new AppError("You have already reviewed this courier", 400);
    }
    updates.courierRating = cRating;
    updates.courierReview = cReview || undefined;
  }

  if (Object.keys(updates).length === 0) {
     throw new AppError("No ratings provided", 400);
  }

  order.customerRating = {
    ...order.customerRating,
    ...updates,
    ratedAt: new Date(),
  };
  await order.save();

  if (updates.restaurantRating) {
    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant) {
      const prevTotal = restaurant.totalReviews ?? 0;
      const prevAvg = restaurant.averageRating ?? 0;
      const newTotal = prevTotal + 1;
      const newAvg = (prevAvg * prevTotal + updates.restaurantRating) / newTotal;

      restaurant.totalReviews = newTotal;
      restaurant.averageRating = Math.round(newAvg * 10) / 10;
      await restaurant.save();
    }
  }

  if (updates.courierRating && order.courier) {
    const courier = await Courier.findById(order.courier);
    if (courier) {
      const prevTotal = courier.totalRatings ?? 0;
      const prevAvg = courier.averageRating ?? 0;
      const newTotal = prevTotal + 1;
      const newAvg = (prevAvg * prevTotal + updates.courierRating) / newTotal;

      courier.totalRatings = newTotal;
      courier.averageRating = Math.round(newAvg * 10) / 10;
      await courier.save();
    }
  }

  return Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location averageRating totalReviews")
    .populate("courier", "fullName phoneNumber profilePicture vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");
}
