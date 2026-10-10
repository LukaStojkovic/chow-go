import { deliverySlots, schedulingInputs } from "@chowgo/shared/scheduling";
import { AppError } from "./AppError.js";

const isLive = (restaurant) => {
  const approved = !restaurant?.approvalStatus || restaurant.approvalStatus === "approved";
  return Boolean(restaurant?.isActive) && approved;
};

/** Whether a closed restaurant still has a slot a customer could schedule for. */
export function takesScheduledOrders(restaurant, now = new Date()) {
  return isLive(restaurant) && deliverySlots(schedulingInputs(restaurant), now).length > 0;
}

// Why a customer cannot order from this restaurant right now, or null. Used
// when a dish goes into the basket, for basket suggestions and at checkout; a
// missing approvalStatus reads as approved. `allowScheduled` admits a closed
// restaurant that still has slots to schedule for, which is what lets a
// customer fill a basket for later.
export function orderingBlockedError(restaurant, { allowScheduled = false, now = new Date() } = {}) {
  if (!restaurant || !isLive(restaurant)) {
    return new AppError("errors:order.restaurantUnavailable", 400, "RESTAURANT_UNAVAILABLE");
  }
  if (restaurant.isOpenNow) return null;
  if (allowScheduled && takesScheduledOrders(restaurant, now)) return null;
  return new AppError("errors:order.restaurantClosed", 400, "RESTAURANT_CLOSED");
}
