import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";

export async function rateOrderOperation({
  orderId,
  customerUserId,
  restaurantRating,
  restaurantReview,
}) {
  const rating = Number(restaurantRating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5", 400);
  }

  const review =
    typeof restaurantReview === "string" ? restaurantReview.trim() : "";
  if (review.length > 500) {
    throw new AppError("Review must be 500 characters or less", 400);
  }

  const order = await Order.findOne({
    _id: orderId,
    customer: customerUserId,
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "delivered") {
    throw new AppError("You can only review delivered orders", 400);
  }
  if (order.customerRating?.restaurantRating) {
    throw new AppError("You have already reviewed this order", 400);
  }

  order.customerRating = {
    restaurantRating: rating,
    restaurantReview: review || undefined,
    ratedAt: new Date(),
  };
  await order.save();

  const restaurant = await Restaurant.findById(order.restaurant);
  if (restaurant) {
    const prevTotal = restaurant.totalReviews ?? 0;
    const prevAvg = restaurant.averageRating ?? 0;
    const newTotal = prevTotal + 1;
    const newAvg = (prevAvg * prevTotal + rating) / newTotal;

    restaurant.totalReviews = newTotal;
    restaurant.averageRating = Math.round(newAvg * 10) / 10;
    await restaurant.save();
  }

  return Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location averageRating totalReviews")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");
}
