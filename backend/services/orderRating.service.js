import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";


/**
 * Folds one rating into the aggregate in a single server-side write.
 *
 * The average used to be re-rounded to one decimal on every fold, so it
 * drifted from the true mean over time. It is now always derived from an
 * exact ratingSum; a document from before ratingSum existed seeds it from its
 * current average times its count.
 */
async function applyRating(Model, id, rating, countField) {
  const count = { $ifNull: ["$" + countField, 0] };
  await Model.updateOne({ _id: id }, [
    {
      $set: {
        ratingSum: {
          $add: [
            { $ifNull: ["$ratingSum", { $multiply: [{ $ifNull: ["$averageRating", 0] }, count] }] },
            rating,
          ],
        },
        [countField]: { $add: [count, 1] },
      },
    },
    // Half-up to one decimal. $round rounds half to even, so 17 over 4 showed
    // as 4.2 rather than the 4.3 a customer expects.
    {
      $set: {
        averageRating: {
          $divide: [
            { $floor: { $add: [{ $multiply: [{ $divide: ["$ratingSum", "$" + countField] }, 10] }, 0.5] } },
            10,
          ],
        },
      },
    },
  ]);
}

// The claim and the "already rated" guard are one write, so two submissions
// landing together cannot both pass a read and both count in the average.
async function claimRating(order, customerUserId, field, value, reviewField, review, extraFilter = {}) {
  const set = { [`customerRating.${field}`]: value, "customerRating.ratedAt": new Date() };
  if (review) set[`customerRating.${reviewField}`] = review;
  const result = await Order.updateOne(
    {
      _id: order._id,
      customer: customerUserId,
      status: "delivered",
      [`customerRating.${field}`]: { $exists: false },
      ...extraFilter,
    },
    { $set: set },
  );
  return result.modifiedCount === 1;
}

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

  // Explicit paths per rating, so a courier rating never overwrites an earlier
  // restaurant rating on the same order (spreading the subdocument once did).
  if (updates.restaurantRating) {
    const claimed = await claimRating(
      order, customerUserId, "restaurantRating", updates.restaurantRating,
      "restaurantReview", updates.restaurantReview,
    );
    if (!claimed) throw new AppError("You have already reviewed this restaurant", 400);
    await applyRating(Restaurant, order.restaurant, updates.restaurantRating, "totalReviews");
  }

  if (updates.courierRating && order.courier) {
    const claimed = await claimRating(
      order, customerUserId, "courierRating", updates.courierRating,
      "courierReview", updates.courierReview, { courier: order.courier },
    );
    if (!claimed) throw new AppError("You have already reviewed this courier", 400);
    await applyRating(Courier, order.courier, updates.courierRating, "totalRatings");
  }

  return Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location averageRating totalReviews")
    .populate("courier", "fullName phoneNumber profilePicture vehicleType currentLocation lastLocationUpdate")
    .populate("items.menuItem", "name imageUrls");
}
