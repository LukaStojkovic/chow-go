import { toMoney } from "./money.js";

/**
 * Who earns what from an order. The restaurant earns the food (subtotal); the
 * delivery, priority fee and tip are the courier's; the service fee is the
 * platform's. Nothing is earned until the order is delivered. Reporting used
 * to credit sellers with the whole total, fees and tip included, from the
 * moment an order was placed, and couriers with the delivery fee alone.
 */

export const courierEarningsOf = (order) =>
  toMoney((order?.deliveryFee ?? 0) + (order?.priorityFee ?? 0) + (order?.tip ?? 0));

export const COURIER_EARNINGS_EXPR = {
  $add: [
    { $ifNull: ["$deliveryFee", 0] },
    { $ifNull: ["$priorityFee", 0] },
    { $ifNull: ["$tip", 0] },
  ],
};

/** Subtotal for a delivered order, 0 otherwise - for groups that count every order. */
export const DELIVERED_SUBTOTAL_EXPR = {
  $cond: [{ $eq: ["$status", "delivered"] }, { $ifNull: ["$subtotal", 0] }, 0],
};
