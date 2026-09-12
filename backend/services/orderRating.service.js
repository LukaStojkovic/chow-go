import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";


/**
 * Folds one rating into a running average atomically.
 *
 * This was load-then-recompute-then-save, so two ratings landing together lost
 * one of them. An update pipeline recomputes server-side in a single write, so
 * there is no read to go stale.
 */
async function applyRating(Model, id, rating, countField) {
  await Model.updateOne({ _id: id }, [
    {
      $set: {
        averageRating: {
          $round: [
            {
              $divide: [
                {
                  $add: [
                    { $multiply: [{ $ifNull: ["$averageRating", 0] }, { $ifNull: ["$" + countField, 0] }] },
                    rating,
                  ],
                },
                { $add: [{ $ifNull: ["$" + countField, 0] }, 1] },
              ],
            },
            1,
          ],
        },
        [countField]: { $add: [{ $ifNull: ["$" + countField, 0] }, 1] },
      },
    },
  ]);
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

  // Spreading order.customerRating copied a Mongoose subdocument's own
  // properties ($__, _doc, $isNew) rather than its schema values, which live
  // behind prototype accessors - so Mongoose dropped the earlier rating on
  // cast. Worse, the duplicate guards above key on restaurantRating rather
  // than ratedAt, so alternating the two calls let one delivered order inflate
  // a restaurant's average without bound. Setting explicit paths keeps both.
  for (const [field, value] of Object.entries(updates)) {
    order.set(`customerRating.${field}`, value);
  }
  order.set("customerRating.ratedAt", new Date());
  await order.save();

  if (updates.restaurantRating) {
    await applyRating(Restaurant, order.restaurant, updates.restaurantRating, "totalReviews");
  }

  if (updates.courierRating && order.courier) {
    await applyRating(Courier, order.courier, updates.courierRating, "totalRatings");
  }

  return Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location averageRating totalReviews")
    .populate("courier", "fullName phoneNumber profilePicture vehicleType currentLocation lastLocationUpdate")
    .populate("items.menuItem", "name imageUrls");
}
