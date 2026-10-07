import { AppError } from "./AppError.js";

// Why a customer cannot order from this restaurant right now, or null. Used
// when a dish goes into the basket and again at checkout; a missing
// approvalStatus reads as approved.
export function orderingBlockedError(restaurant) {
  const approved = !restaurant?.approvalStatus || restaurant.approvalStatus === "approved";
  if (!restaurant || !restaurant.isActive || !approved) {
    return new AppError("errors:order.restaurantUnavailable", 400, "RESTAURANT_UNAVAILABLE");
  }
  if (!restaurant.isOpenNow) {
    return new AppError("errors:order.restaurantClosed", 400, "RESTAURANT_CLOSED");
  }
  return null;
}
