/**
 * Order view-model adapter.
 *
 * Owns the mapping from the backend's ten-value status enum to the six steps a
 * customer actually understands, and to the copy shown for each. Status text
 * lives here rather than in components so a badge, a timeline node and a
 * screen-reader announcement can never describe the same order differently.
 */

import { formatOrderDate } from "../format.js";
import { toRestaurantView } from "./restaurant.js";
import { toBasketLines } from "./menu.js";
import { breakdownFromOrder } from "./pricing.js";

/** @typedef {import("./types").OrderView} OrderView */
/** @typedef {import("./types").OrderStepView} OrderStepView */

/**
 * Every status the backend can report, with the copy the customer sees.
 * `tone` maps onto the semantic status tokens, never onto a raw colour.
 */
export const ORDER_STATUS = {
  pending: {
    label: "Waiting for confirmation",
    description: "The restaurant has your order and will confirm it shortly.",
    tone: "warning",
    lifecycle: "pending",
  },
  confirmed: {
    label: "Order confirmed",
    description: "The restaurant accepted your order.",
    tone: "info",
    lifecycle: "active",
  },
  preparing: {
    label: "Being prepared",
    description: "Your food is being cooked right now.",
    tone: "info",
    lifecycle: "active",
  },
  ready: {
    label: "Ready for pickup",
    description: "Your order is packed and waiting for a courier.",
    tone: "info",
    lifecycle: "active",
  },
  assigned: {
    label: "Courier on the way to the restaurant",
    description: "A courier has taken your order and is heading to collect it.",
    tone: "info",
    lifecycle: "active",
  },
  picked_up: {
    label: "Picked up",
    description: "The courier has your order and is setting off.",
    tone: "info",
    lifecycle: "active",
  },
  in_transit: {
    label: "On the way to you",
    description: "Your courier is on the way. Follow them on the map below.",
    tone: "primary",
    lifecycle: "active",
  },
  delivered: {
    label: "Delivered",
    description: "Your order arrived. Enjoy.",
    tone: "success",
    lifecycle: "delivered",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled.",
    tone: "destructive",
    lifecycle: "cancelled",
  },
  rejected: {
    label: "Declined by restaurant",
    description: "The restaurant could not take this order.",
    tone: "destructive",
    lifecycle: "cancelled",
  },
};

/** Order of progression, used to decide which timeline steps are complete. */
const STATUS_SEQUENCE = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
];

/**
 * The six steps shown to the customer, each mapped to the backend statuses and
 * timestamp field that satisfy it.
 */
const TIMELINE_STEPS = [
  {
    id: "received",
    label: "Order placed",
    description: "We sent your order to the restaurant.",
    reachedAt: "createdAt",
    satisfiedBy: "pending",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    description: "The restaurant accepted your order.",
    reachedAt: "confirmedAt",
    satisfiedBy: "confirmed",
  },
  {
    id: "preparing",
    label: "Preparing",
    description: "Your food is being cooked.",
    reachedAt: "preparingAt",
    satisfiedBy: "preparing",
  },
  {
    id: "assigned",
    label: "Courier assigned",
    description: "A courier is collecting your order.",
    reachedAt: "assignedAt",
    satisfiedBy: "assigned",
  },
  {
    id: "on_the_way",
    label: "On the way",
    description: "Your order is heading to you.",
    reachedAt: "pickedUpAt",
    satisfiedBy: "picked_up",
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Your order arrived.",
    reachedAt: "deliveredAt",
    satisfiedBy: "delivered",
  },
];

const PAYMENT_LABELS = {
  cash: "Cash on delivery",
  card: "Card",
  wallet: "Wallet",
};

/**
 * Build the timeline for an order.
 *
 * @param {Object} order Raw order document.
 * @returns {OrderStepView[]}
 */
export function toOrderSteps(order) {
  const statusIndex = STATUS_SEQUENCE.indexOf(order?.status);

  return TIMELINE_STEPS.map((step) => {
    const stepIndex = STATUS_SEQUENCE.indexOf(step.satisfiedBy);
    const at = order?.[step.reachedAt] || null;

    /** @type {"complete" | "current" | "upcoming"} */
    let state = "upcoming";
    if (statusIndex > stepIndex || order?.status === "delivered") {
      state = "complete";
    } else if (statusIndex === stepIndex) {
      state = "current";
      // `ready` and `in_transit` have no step of their own; they advance the
      // step before them rather than adding a node the customer must decode.
    } else if (
      (order?.status === "ready" && step.id === "preparing") ||
      (order?.status === "in_transit" && step.id === "on_the_way")
    ) {
      state = "current";
    }

    // A timestamp is proof the step happened, even if the sequence lookup
    // missed it (e.g. an order that skipped straight to in_transit).
    if (at && state === "upcoming") state = "complete";

    return { id: step.id, label: step.label, description: step.description, state, at };
  });
}

/**
 * @param {Object | null | undefined} raw
 * @returns {import("./types").CourierView | null}
 */
function toCourierView(raw) {
  if (!raw) return null;
  const user = raw.userId && typeof raw.userId === "object" ? raw.userId : null;
  const id = raw._id || raw.id;
  if (!id) return null;

  return {
    id: String(id),
    name: user?.name || raw.name || "Your courier",
    avatar: user?.profilePicture || raw.profilePicture || null,
    phone: user?.phoneNumber || raw.phoneNumber || null,
    vehicle: raw.vehicleType || null,
    rating: typeof raw.averageRating === "number" && raw.averageRating > 0 ? raw.averageRating : null,
  };
}

/**
 * Compose the one-line delivery address from the snapshot stored on the order.
 *
 * @param {Object | null | undefined} snapshot
 * @returns {string | null}
 */
function toDeliveryAddress(snapshot) {
  if (!snapshot) return null;
  const detail = [
    snapshot.buildingName,
    snapshot.apartment && `Apt ${snapshot.apartment}`,
    snapshot.floor && `Floor ${snapshot.floor}`,
  ]
    .filter(Boolean)
    .join(", ");

  return [snapshot.fullAddress, detail].filter(Boolean).join(" - ") || null;
}

/**
 * @param {Object | null | undefined} raw
 * @returns {OrderView | null}
 */
export function toOrderView(raw) {
  if (!raw || !raw._id) return null;

  const status = raw.status || "pending";
  const meta = ORDER_STATUS[status] || ORDER_STATUS.pending;
  const items = toBasketLines(raw.items);
  const isTerminal = ["delivered", "cancelled", "rejected"].includes(status);

  return {
    id: String(raw._id),
    number: raw.orderNumber ? String(raw.orderNumber) : String(raw._id).slice(-6).toUpperCase(),
    status,
    statusLabel: meta.label,
    statusDescription: meta.description,
    statusTone: meta.tone,
    lifecycle: meta.lifecycle,
    isTerminal,
    // Mirrors utils/orderStatus.js#canCustomerCancel exactly. The previous
    // list offered Cancel during "preparing", where the API returns 400 - and
    // that is where an order sits longest.
    canCancel: ["pending", "confirmed", "ready", "assigned"].includes(status),
    canReorder: isTerminal,
    canRate: status === "delivered" && !raw.customerRating?.ratedAt,
    placedAt: raw.createdAt,
    placedAtLabel: formatOrderDate(raw.createdAt),
    etaAt: raw.estimatedDeliveryTime || null,
    items,
    itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
    pricing: breakdownFromOrder(raw),
    paymentMethod: raw.paymentMethod || "cash",
    paymentMethodLabel: PAYMENT_LABELS[raw.paymentMethod] || "Cash on delivery",
    restaurant: toRestaurantView(raw.restaurant),
    courier: toCourierView(raw.courier),
    deliveryAddress: toDeliveryAddress(raw.deliveryAddressSnapshot),
    deliveryNotes: raw.deliveryAddressSnapshot?.notes || null,
    notes: raw.customerNotes || null,
    cancellationReason: raw.cancellationReason || raw.rejectionReason || null,
    rating: raw.customerRating || null,
    steps: toOrderSteps(raw),
  };
}

/**
 * @param {unknown} list
 * @returns {OrderView[]}
 */
export function toOrderViews(list) {
  if (!Array.isArray(list)) return [];
  return list.map(toOrderView).filter(Boolean);
}

/** Statuses the "Active" filter covers, matching the backend's ACTIVE_STATUSES. */
export const ACTIVE_STATUS_FILTER =
  "pending,confirmed,preparing,ready,assigned,picked_up,in_transit";
