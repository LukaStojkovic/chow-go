export const TRAVEL_MINUTES = { standard: 30, priority: 15 };

export function estimatedDeliveryAt(prepMinutes, isPriority, now = Date.now()) {
  const travel = isPriority ? TRAVEL_MINUTES.priority : TRAVEL_MINUTES.standard;
  return new Date(now + (prepMinutes + travel) * 60 * 1000);
}
