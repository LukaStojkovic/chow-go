const VALID_TRANSITIONS = {
  confirmed: ["preparing"],
  preparing: ["ready"],
};

const ACTIVE_STATUSES = [
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

export function canCancel(status) {
  return ["confirmed", "preparing", "ready"].includes(status);
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
