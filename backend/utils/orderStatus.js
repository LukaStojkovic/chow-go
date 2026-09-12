const VALID_TRANSITIONS = {
  confirmed: ["preparing"],
  preparing: ["ready"],
};

export const ACTIVE_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "in_transit",
];

const STATUS_METADATA = {
  pending: { label: "Pending", priority: "high" },
  confirmed: { label: "Confirmed", priority: "high" },
  preparing: { label: "Preparing", priority: "medium" },
  ready: { label: "Ready", priority: "high" },
  assigned: { label: "Assigned", priority: "medium" },
  picked_up: { label: "Picked Up", priority: "medium" },
  in_transit: { label: "In Transit", priority: "medium" },
  delivered: { label: "Delivered", priority: "low" },
  cancelled: { label: "Cancelled", priority: "high" },
  rejected: { label: "Rejected", priority: "high" },
};

export function isValidTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}

export function getStatusMetadata(status) {
  return STATUS_METADATA[status] || { label: status, priority: "low" };
}

export function canConfirm(status) {
  return status === "pending";
}

export function canReject(status) {
  return status === "pending";
}

/** Restaurant-side cancel. */
export const RESTAURANT_CANCELLABLE = ["confirmed", "preparing", "ready"];

export function canCancel(status) {
  return RESTAURANT_CANCELLABLE.includes(status);
}

/**
 * Every status a given status is legally reachable from - the inverse of
 * VALID_TRANSITIONS. An atomic transition needs this: the filter has to name
 * the statuses the write is allowed from, rather than reading the current one
 * first and then writing.
 */
export function statusesThatReach(newStatus) {
  return Object.entries(VALID_TRANSITIONS)
    .filter(([, allowed]) => allowed.includes(newStatus))
    .map(([from]) => from);
}

/**
 * Customer-side cancel. Was an inline array in orderController that disagreed
 * with the copy in shared/src/adapters/order.js two ways: it blocked
 * "preparing" the UI still offered, and it permitted "rejected", which let a
 * customer overwrite a seller's rejection reason.
 *
 * "assigned" stays cancellable - a courier on the way to the restaurant is not
 * a reason to trap the customer - but the handler must release that courier.
 */
export function canCustomerCancel(status) {
  return ["pending", "confirmed", "ready", "assigned"].includes(status);
}

export function parseStatusFilter(statusParam) {
  if (!statusParam) return null;

  if (statusParam === "active") {
    return { $in: ACTIVE_STATUSES };
  }

  if (statusParam.includes(",")) {
    return { $in: statusParam.split(",") };
  }

  return statusParam;
}
