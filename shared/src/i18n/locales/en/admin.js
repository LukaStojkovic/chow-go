/**
 * The admin console. Staff-facing, so it favours precise over friendly.
 */
export default {
  title: "Admin console",
  subtitle: "Approve restaurants, verify couriers, suspend accounts. Every change is logged.",
  openConsole: "Open the admin console",

  overview: {
    pendingRestaurants: "Restaurants waiting",
    pendingCouriers: "Couriers waiting",
    suspendedUsers: "Suspended accounts",
    activeOrders: "Orders in progress",
  },

  tabs: {
    restaurants: "Restaurants",
    couriers: "Couriers",
    users: "Accounts",
    orders: "Orders",
    audit: "Audit log",
  },

  filters: {
    all: "All",
    search: "Search by name, email or phone",
  },

  restaurantStatus: {
    pending: "Waiting for approval",
    approved: "Live",
    rejected: "Rejected",
    suspended: "Suspended",
  },
  courierStatus: {
    pending: "Waiting",
    verified: "Verified",
    rejected: "Rejected",
  },

  columns: {
    name: "Name",
    owner: "Owner",
    city: "City",
    status: "Status",
    joined: "Joined",
    email: "Email",
    phone: "Phone",
    role: "Role",
    vehicle: "Vehicle",
    deliveries: "Deliveries",
    actions: "Actions",
    when: "When",
    admin: "Admin",
    action: "Action",
    target: "Target",
    reason: "Reason",
  },

  actions: {
    approve: "Approve",
    reject: "Reject",
    suspend: "Suspend",
    reinstate: "Reinstate",
    verify: "Verify",
    resetToPending: "Back to waiting",
    suspendAccount: "Suspend account",
    unsuspendAccount: "Lift suspension",
    cancelOrder: "Cancel order",
  },

  reason: {
    title: "{{action}}: {{name}}",
    label: "Reason",
    placeholder: "What happened, for the audit log",
    required: "A reason is required for this.",
    optional: "Optional, but it helps whoever reads the log later.",
    confirm: "Confirm",
    cancel: "Cancel",
  },

  orders: {
    hint: "Ends any unfinished order, frees its courier and tells everyone involved.",
    orderId: "Order id",
    orderIdPlaceholder: "The order's id from the database or a support ticket",
  },

  suspendedSince: "Suspended {{date}}",
  adminBadge: "Admin",
  saved: "Saved",
  failed: "That did not work",
  loadFailed: "Could not load this list",
  empty: "Nothing here",
  page: "Page {{page}} of {{pages}}",
  previous: "Previous",
  next: "Next",
};
