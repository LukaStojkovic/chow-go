/**
 * Order view-model adapter.
 *
 * Owns the mapping from the backend's ten-value status enum to the six steps a
 * customer actually understands, and to the copy key shown for each. Status
 * text is resolved here rather than in components so a badge, a timeline node,
 * a screen-reader announcement and a push notification can never describe the
 * same order differently.
 */

import { formatOrderDate } from "../format.js";
import { t } from "../i18n/index.js";
import { toRestaurantView } from "./restaurant.js";
import { toBasketLines } from "./menu.js";
import { breakdownFromOrder } from "./pricing.js";

/** @typedef {import("./types").OrderView} OrderView */
/** @typedef {import("./types").OrderStepView} OrderStepView */


/**
 * Every status the backend can report, with its presentation metadata.
 *
 * The copy itself lives in the `order:status` catalog and is resolved by
 * `statusMeta()` - baking a label in here would freeze it in whichever
 * language happened to load first. `tone` maps onto the semantic status
 * tokens, never onto a raw colour.
 */
export const ORDER_STATUS_META = {
  pending: { tone: "warning", lifecycle: "pending" },
  confirmed: { tone: "info", lifecycle: "active" },
  preparing: { tone: "info", lifecycle: "active" },
  ready: { tone: "info", lifecycle: "active" },
  assigned: { tone: "info", lifecycle: "active" },
  picked_up: { tone: "info", lifecycle: "active" },
  in_transit: { tone: "primary", lifecycle: "active" },
  delivered: { tone: "success", lifecycle: "delivered" },
  cancelled: { tone: "destructive", lifecycle: "cancelled" },
  rejected: { tone: "destructive", lifecycle: "cancelled" },
};

/** Every status value the backend can report, in no particular order. */
export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META);

/**
 * Tone, lifecycle and copy for a status, in the language active right now.
 *
 * @param {string | null | undefined} status
 * @returns {{ status: string, label: string, description: string, tone: string, lifecycle: string }}
 */
export function statusMeta(status) {
  const known = ORDER_STATUS_META[status] ? status : "pending";
  return {
    status: known,
    label: t(`order:status.${known}.label`),
    description: t(`order:status.${known}.description`),
    ...ORDER_STATUS_META[known],
  };
}

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
 * timestamp field that satisfy it. Copy comes from the `order:step` catalog,
 * keyed by `id`.
 */
const TIMELINE_STEPS = [
  { id: "received", reachedAt: "createdAt", satisfiedBy: "pending" },
  { id: "confirmed", reachedAt: "confirmedAt", satisfiedBy: "confirmed" },
  { id: "preparing", reachedAt: "preparingAt", satisfiedBy: "preparing" },
  { id: "assigned", reachedAt: "assignedAt", satisfiedBy: "assigned" },
  { id: "on_the_way", reachedAt: "pickedUpAt", satisfiedBy: "picked_up" },
  { id: "delivered", reachedAt: "deliveredAt", satisfiedBy: "delivered" },
];

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

    return {
      id: step.id,
      label: t(`order:step.${step.id}.label`),
      description: t(`order:step.${step.id}.description`),
      state,
      at,
    };
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
    name: user?.name || raw.name || t("order:courier.fallbackName"),
    avatar: user?.profilePicture || raw.profilePicture || null,
    phone: user?.phoneNumber || raw.phoneNumber || null,
    vehicle: raw.vehicleType || null,
    vehicleLabel: raw.vehicleType
      ? t(`order:courier.vehicle.${raw.vehicleType}`, { defaultValue: raw.vehicleType })
      : null,
    rating:
      typeof raw.averageRating === "number" && raw.averageRating > 0
        ? raw.averageRating
        : null,
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
    snapshot.apartment && t("order:address.apartment", { value: snapshot.apartment }),
    snapshot.floor && t("order:address.floor", { value: snapshot.floor }),
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
  const meta = statusMeta(status);
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
    paymentMethodLabel: t(`order:payment.${raw.paymentMethod || 'cash'}`, {
      defaultValue: t('order:payment.cash'),
    }),
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
