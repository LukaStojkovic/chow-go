export default {
  push: {
    voucherTitle: "You've received a voucher",
    voucherBody: "{{amount}} off your next order. Code: {{code}}",
    voucherBodyFreeDelivery: "Free delivery on your next order. Code: {{code}}",
  },

  checkout: {
    title: "Promo code",
    label: "Promo code",
    placeholder: "Enter a code",
    apply: "Apply",
    remove: "Remove code",
    applied: "{{code}} applied",
    saving: "You save {{amount}}",
    yourVouchers: "Your vouchers",
    useVoucher: "Use {{code}}",
    failed: "That code could not be applied",
    dropped: "Your promo code was removed: {{reason}}",
  },

  discount: {
    percentage: "{{value}}% off",
    percentageCapped: "{{value}}% off, up to {{max}}",
    fixed: "{{amount}} off",
    free_delivery: "Free delivery",
  },

  conditions: {
    minSubtotal: "On orders over {{amount}}",
    endsAt: "Valid until {{date}}",
    firstOrderOnly: "First order only",
    perCustomer_one: "{{count}} use per customer",
    perCustomer_other: "{{count}} uses per customer",
  },

  vouchers: {
    title: "My vouchers",
    description: "Codes issued to you. Apply one at checkout.",
    empty: "You have no vouchers right now.",
    copy: "Copy code",
    copied: "Code copied",
  },

  manage: {
    title: "Promo codes",
    description: "Codes customers enter at checkout. Discounts on your codes come out of your food revenue.",
    adminDescription: "Platform codes are paid for by the platform. Restaurant codes are listed for oversight.",
    create: "New code",
    edit: "Edit code",
    save: "Save code",
    cancel: "Cancel",
    saved: "Code saved",
    updated: "Code updated",
    empty: "No promo codes yet",
    emptyDescription: "Create a code to run a deal for new or returning customers.",
    lockedNotice: "This code has been used, so its discount can no longer change. Create a new code instead.",
    archiveConfirm: "Archive {{code}}? Customers will no longer be able to use it, and this cannot be undone.",
    loadFailed: "We could not load your promo codes",
  },

  fields: {
    code: "Code",
    codeHint: "4-24 letters, digits or dashes. Customers type this.",
    label: "Description",
    labelHint: "Shown to the customer, e.g. \"Spring deal\".",
    type: "Discount",
    value: "Value",
    valuePercent: "Percent off",
    valueAmount: "Amount off ({{currency}})",
    maxDiscount: "Maximum discount ({{currency}})",
    maxDiscountHint: "Optional cap on a percentage discount.",
    minSubtotal: "Minimum order ({{currency}})",
    startsAt: "Starts",
    endsAt: "Ends",
    maxRedemptions: "Total uses",
    maxRedemptionsHint: "Leave empty for unlimited.",
    perCustomerLimit: "Uses per customer",
    firstOrderOnly: "First order only",
    currency: "Currency",
    validDays: "Valid for (days)",
  },

  types: {
    percentage: "Percentage",
    fixed: "Fixed amount",
    free_delivery: "Free delivery",
  },

  columns: {
    code: "Code",
    owner: "Owner",
    discount: "Discount",
    uses: "Uses",
    validity: "Valid",
    status: "Status",
    actions: "Actions",
  },

  status: {
    active: "Active",
    paused: "Paused",
    archived: "Archived",
  },

  actions: {
    pause: "Pause",
    resume: "Resume",
    archive: "Archive",
    edit: "Edit",
    stats: "Results",
  },

  uses: {
    unlimited: "{{used}} used",
    limited: "{{used}} / {{max}}",
  },

  validity: {
    always: "No end date",
    until: "Until {{date}}",
    from: "From {{date}}",
    range: "{{from}} - {{to}}",
  },

  stats: {
    title: "Results for {{code}}",
    orders: "Orders",
    delivered: "Delivered",
    discountGiven: "Discount given",
    revenue: "Food revenue",
  },

  scope: {
    all: "All codes",
    platform: "Platform",
    restaurant: "Restaurant",
    personal: "Personal voucher",
  },

  admin: {
    issueVoucher: "Issue voucher",
    issueTitle: "Issue a voucher for {{orderNumber}}",
    issueDescription: "A single-use code for this order's customer, paid for by the platform.",
    issued: "Voucher {{code}} issued",
    pauseReason: "Why is this code being paused?",
    reason: "Reason",
    reasonPlaceholder: "Logged in the audit trail",
  },
};
