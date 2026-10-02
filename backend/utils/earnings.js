import { toMoney } from "./money.js";

/**
 * Who earns what from an order. The restaurant earns the food (subtotal); the
 * delivery, priority fee and tip are the courier's; the service fee is the
 * platform's. Nothing is earned until the order is delivered. Reporting used
 * to credit sellers with the whole total, fees and tip included, from the
 * moment an order was placed, and couriers with the delivery fee alone.
 *
 * A promo code's discount comes out of whoever issued it: a restaurant code
 * out of the subtotal, a platform code out of the service fee (which can go
 * below zero - that is the marketing spend). The courier's share never moves.
 */

const fundedDiscount = (order, by) =>
  order?.promo?.fundedBy === by ? Number(order?.discount) || 0 : 0;

export const courierEarningsOf = (order) =>
  toMoney((order?.deliveryFee ?? 0) + (order?.priorityFee ?? 0) + (order?.tip ?? 0));

export const restaurantEarningsOf = (order) =>
  toMoney((order?.subtotal ?? 0) - fundedDiscount(order, "restaurant"));

export const platformEarningsOf = (order) =>
  toMoney((order?.serviceFee ?? 0) - fundedDiscount(order, "platform"));

export const COURIER_EARNINGS_EXPR = {
  $add: [
    { $ifNull: ["$deliveryFee", 0] },
    { $ifNull: ["$priorityFee", 0] },
    { $ifNull: ["$tip", 0] },
  ],
};

export const RESTAURANT_DISCOUNT_EXPR = {
  $cond: [{ $eq: ["$promo.fundedBy", "restaurant"] }, { $ifNull: ["$discount", 0] }, 0],
};

export const RESTAURANT_EARNINGS_EXPR = {
  $subtract: [{ $ifNull: ["$subtotal", 0] }, RESTAURANT_DISCOUNT_EXPR],
};

/** Restaurant earnings for a delivered order, 0 otherwise - for groups that count every order. */
export const DELIVERED_SUBTOTAL_EXPR = {
  $cond: [{ $eq: ["$status", "delivered"] }, RESTAURANT_EARNINGS_EXPR, 0],
};
