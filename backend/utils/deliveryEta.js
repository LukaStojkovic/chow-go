import { haversineMeters, toLatLng } from "@chowgo/shared/geo";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

export const TRAVEL_MINUTES = { standard: 30, priority: 15 };

// A city ride on a scooter or bike, plus parking and the handoff at the door.
const RIDE_SPEED_KMH = 18;
const HANDOFF_MINUTES = 5;
const RIDE_LIMITS = { min: 8, max: 60 };
// A courier is usually a few minutes from the counter when the food is ready.
const COURIER_WAIT_MINUTES = 5;

const minutesFrom = (now, minutes) => new Date(now + minutes * 60 * 1000);

export function estimatedDeliveryAt(prepMinutes, isPriority, now = Date.now()) {
  const travel = isPriority ? TRAVEL_MINUTES.priority : TRAVEL_MINUTES.standard;
  return minutesFrom(now, prepMinutes + travel);
}

/** Minutes from the restaurant door to the customer's, or null without coordinates. */
export function rideMinutes(from, to) {
  if (!from || !to) return null;
  const km = haversineMeters(from, to) / 1000;
  const minutes = Math.ceil((km / RIDE_SPEED_KMH) * 60) + HANDOFF_MINUTES;
  return Math.min(RIDE_LIMITS.max, Math.max(RIDE_LIMITS.min, minutes));
}

/** The ride for an order, read from its dropoff and its restaurant. */
export async function rideMinutesForOrder(orderId) {
  const order = await Order.findById(orderId).select("restaurant deliveryAddressSnapshot.location").lean();
  if (!order) return null;
  const restaurant = await Restaurant.findById(order.restaurant).select("location").lean();
  return rideMinutes(
    toLatLng(restaurant?.location?.coordinates),
    toLatLng(order.deliveryAddressSnapshot?.location?.coordinates),
  );
}

// The arrival estimate is revised as the order moves: when the food is ready
// it is a courier's wait plus the ride, once picked up it is the ride alone.
export function etaWhenReady(ride, now = Date.now()) {
  return minutesFrom(now, COURIER_WAIT_MINUTES + (ride ?? TRAVEL_MINUTES.standard));
}

export function etaWhenPickedUp(ride, now = Date.now()) {
  return minutesFrom(now, ride ?? TRAVEL_MINUTES.standard);
}
