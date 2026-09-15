/**
 * Order copy: statuses, the customer timeline, history and rating.
 *
 * The `status` and `step` blocks are read by `adapters/order.js`, which is the
 * only place allowed to describe an order's state - a badge, a timeline node,
 * a screen-reader announcement and a push notification all resolve here, so
 * they cannot describe the same order differently.
 */

export default {
  short: {
    pending: "Awaiting confirmation",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    assigned: "Courier assigned",
    picked_up: "Picked up",
    in_transit: "On the way",
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Declined",
  },
  // Single-word forms for the six-column timeline; the status labels are
  // written to be read aloud and will not fit a column on a phone.
  timeline: {
    received: "Placed",
    confirmed: "Confirmed",
    preparing: "Cooking",
    assigned: "Courier",
    on_the_way: "On the way",
    delivered: "Delivered",
  },

  status: {
    pending: {
      label: "Waiting for confirmation",
      description: "The restaurant has your order and will confirm it shortly.",
    },
    confirmed: {
      label: "Order confirmed",
      description: "The restaurant accepted your order.",
    },
    preparing: {
      label: "Being prepared",
      description: "Your food is being cooked right now.",
    },
    ready: {
      label: "Ready for pickup",
      description: "Your order is packed and waiting for a courier.",
    },
    assigned: {
      label: "Courier on the way to the restaurant",
      description: "A courier has taken your order and is heading to collect it.",
    },
    picked_up: {
      label: "Picked up",
      description: "The courier has your order and is setting off.",
    },
    in_transit: {
      label: "On the way to you",
      description: "Your courier is on the way. Follow them on the map below.",
    },
    delivered: {
      label: "Delivered",
      description: "Your order arrived. Enjoy.",
    },
    cancelled: {
      label: "Cancelled",
      description: "This order was cancelled.",
    },
    rejected: {
      label: "Declined by restaurant",
      description: "The restaurant could not take this order.",
    },
  },

  step: {
    received: {
      label: "Order placed",
      description: "We sent your order to the restaurant.",
    },
    confirmed: {
      label: "Confirmed",
      description: "The restaurant accepted your order.",
    },
    preparing: {
      label: "Preparing",
      description: "Your food is being cooked.",
    },
    assigned: {
      label: "Courier assigned",
      description: "A courier is collecting your order.",
    },
    on_the_way: {
      label: "On the way",
      description: "Your order is heading to you.",
    },
    delivered: {
      label: "Delivered",
      description: "Your order arrived.",
    },
  },

  payment: {
    cash: "Cash on delivery",
    card: "Card",
    wallet: "Wallet",
  },

  courier: {
    fallbackName: "Your courier",
    deliveringBy: "Delivering by {{vehicle}}",
    vehicle: {
      bike: "Bicycle",
      scooter: "Scooter",
      motorcycle: "Motorcycle",
      car: "Car",
    },
  },

  address: {
    apartment: "Apt {{value}}",
    floor: "Floor {{value}}",
  },

  number: "Order #{{number}}",
  itemCount_one: "{{count}} item",
  itemCount_other: "{{count}} items",

  placedRelative: {
    today: "Today, {{time}}",
    yesterday: "Yesterday, {{time}}",
    older: "{{date}}, {{time}}",
  },

  ago: {
    justNow: "Just now",
    hours: "{{count}}h ago",
    days: "{{count}}d ago",
  },

  eta: {
    label: "Estimated arrival",
    minutes_one: "{{count}} min",
    minutes_other: "{{count}} min",
    arriving: "Arriving now",
    unknown: "Being worked out",
  },

  list: {
    title: "Your orders",
    subtitle: "Everything you have ordered, newest first.",
    guestTitle: "Sign in to see your orders",
    guestDescription: "Your order history lives with your account.",
    tabs: {
      active: "Active",
      past: "Past",
      all: "All",
    },
    empty: {
      active: {
        title: "No orders on the way",
        description: "When you place an order it will show up here so you can follow it.",
        action: "Find something to eat",
      },
      past: {
        title: "Nothing here yet",
        description: "Your delivered and cancelled orders will be listed here.",
      },
    },
    error: {
      title: "We could not load your orders",
      description: "Check your connection and try again.",
    },
  },

  history: {
    loading: "Loading your orders",
    filterLabel: "Filter orders",
    showAll: "Show all orders",
    pagesLabel: "Order history pages",
    pageOf: "Page {{current}} of {{total}}",
    error: {
      description: "This is a connection problem, not a problem with your orders.",
    },
    tabs: {
      all: "All",
      active: "Active",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
    empty: {
      all: {
        title: "No orders yet",
        description: "Once you place your first order it will live here, ready to reorder.",
      },
      active: {
        title: "Nothing in progress",
        description: "You have no orders being prepared or on their way right now.",
      },
      delivered: {
        title: "No delivered orders yet",
        description: "Orders show up here once they have arrived.",
      },
      cancelled: {
        title: "No cancelled orders",
        description: "Nothing here - which is exactly how it should be.",
      },
    },
  },

  detail: {
    title: "Order",
    itemsHeading: "Your order",
    helpContact: "Reach us at {{email}}",
    noLongerActive: "This order is no longer active.",
    cancelled: "Order cancelled",
    cancelFailed: "Could not cancel",
    placeFailed: "Could not place your order",
    restaurantLost: "We lost track of the restaurant",
    restaurantLostHint: "Pull up your basket again and retry.",
    confirmSoon: "{{name}} will confirm it in a moment.",
    confirmSoonFallback: "The restaurant will confirm it in a moment.",
    awaitingConfirmation: "Awaiting confirmation",
    numbered: "Order #{{number}}",
    summaryHeading: "Payment summary",
    deliveryHeading: "Delivery",
    notesHeading: "Delivery instructions",
    restaurantNotes: "Note for the restaurant",
    placedAt: "Placed {{value}}",
    notFound: {
      title: "Order not found",
      description: "This order does not exist, or it belongs to a different account.",
    },
    error: {
      title: "We could not show this order",
      description: "Check your connection and try again.",
      connection: "The connection dropped on the way. Your order is not affected.",
    },
    noAddress: "No address recorded",
    placed: "Your order was placed.",
    placeFailedLong:
      "We could not place your order. Nothing has been charged - please try again.",
    cancelledSuccess: "Order cancelled",
    cancelFailedShort: "Could not cancel the order",
    noReasonRefund: "No reason was given. If you were charged, it will be refunded.",
    cancelledByCustomerShort: "Cancelled by customer",
    totalToPay: "Total to pay",
    estimatedDelivery: "Estimated delivery",
    youSave: "You save",
  },

  actions: {
    track: "Track order",
    reorder: "Order again",
    rate: "Rate this order",
    cancel: "Cancel order",
    viewReceipt: "View receipt",
    callRestaurant: "Call restaurant",
    callCourier: "Call courier",
    help: "Get help",
  },

  cancel: {
    title: "Cancel this order?",
    description:
      "The restaurant will be told straight away. You cannot undo this.",
    confirm: "Yes, cancel it",
    dismiss: "Keep it",
    reasonHint: "Let the restaurant know why - it reaches their kitchen screen.",
    reasonPlaceholder: "Tell them why",
    reasons: {
      changedMind: "Changed my mind",
      byMistake: "Ordered by mistake",
      tooLong: "Taking too long",
      other: "Something else",
    },
    success: "Your order was cancelled.",
    tooLate:
      "This order has gone too far to cancel here - the restaurant can usually fix it fastest.",
    longDescription:
      "The restaurant will be told to stop preparing it. This cannot be undone - you would need to place a new order.",
    cancelling: "Cancelling...",
  },

  support: {
    getHelp: "Get help with this order",
    shortTitle: "Support",
    messageCourier: "Message your courier",
    title: "Help with order #{{number}}",
    description:
      "Something wrong with this order? The restaurant can usually sort it out fastest while the order is still being prepared.",
    callNamed: "Call {{name}}",
  },

  reorder: {
    success: "Added back to your basket.",
    replacedBasket: "Your basket was replaced with this order.",
    unavailable: "Some dishes are no longer available and were left out.",
    allUnavailable: "Nothing from this order is available right now.",
  },

  rating: {
    title: "How was it?",
    subtitle: "Your rating helps {{name}} and other customers.",
    restaurantHeading: "The food",
    courierHeading: "The delivery",
    commentLabel: "Anything you want to add?",
    commentPlaceholder: "Tell them what went well, or what did not.",
    foodPlaceholder: "How was the food? (optional)",
    deliveryPlaceholder: "How was the delivery? (optional)",
    submitting: "Submitting your review",
    submit: "Submit review",
    skip: "Not now",
    success: "Thanks for the feedback.",
    alreadyRated: "You have already rated this order.",
    scores: {
      1: "Poor",
      2: "Not great",
      3: "Fine",
      4: "Good",
      5: "Excellent",
    },
    notGreat: "Not great",
    tapToRate: "Tap to rate",
    activeHeading: "Everything on its way to you",
    pastHeading: "Delivered and cancelled orders",
    emptyActive: "No active orders",
    emptyPast: "No past orders",
    emptyActiveHint: "When you order, you can follow it here from the kitchen to your door.",
    emptyPastHint: "Delivered and cancelled orders show up here.",
    thanks: "Thanks for the feedback",
    submitFailed: "Could not submit your rating",
    stars_one: "{{count}} star",
    stars_other: "{{count}} stars",
    submitted: "Thank you for your review.",
    submitFailedShort: "Could not submit your review",
    yourReview: "Your review",
    howDidItGo: "How did it go?",
    thanksHelps: "Thanks - this helps other people choose.",
    helpsOthers:
      "Your rating helps the restaurant and the courier, and helps others decide.",
  },

  confirmed: {
    title: "Order placed",
    subtitle: "{{name}} has your order and will confirm it in a moment.",
    trackAction: "Follow your order",
    homeAction: "Keep browsing",
    loading: "Loading your order",
    heading: "Your order is on its way to the restaurant",
    orderNumber: "Order number",
    placed: "Placed",
    payingBy: "Paying by",
    payingByValue: "Paying by {{method, lowercase}}",
    error: {
      title: "We could not load your order",
      description:
        "Your order was placed - this page just could not fetch it. It is in your order history.",
    },
    confirmSoonLong:
      "{{name}} will confirm it in the next few minutes. We will keep you posted.",
    fallbackRestaurant: "The restaurant",
  },

  tracking: {
    title: "Tracking",
    mapHeading: "Order map",
    mapUnavailable: "The map is unavailable right now.",
    courierHeading: "Your courier",
    courierPending: "A courier will be assigned once the food is ready.",
    liveLocation: "Live location",
    lastUpdated: "Updated {{value}}",
    arrivedTitle: "Your order has arrived",
    arrivedBody: "Enjoy your food.",
  },

  /**
   * Push and stored-notification copy. Rendered in the *recipient's* language
   * by `backend/services/orderNotification.service.js`, which is why these are
   * not folded into `status` - a push says what just happened, a status badge
   * says where the order is now.
   */
  notification: {
    preparingBody: "Your order is being prepared",
    readyBody: "Your order is ready",
    order_placed: {
      title: "New order",
      body: "Order #{{number}} is waiting for you to confirm",
    },
    order_available: {
      title: "Delivery available",
      body: "Order #{{number}} is ready for pickup",
    },
    order_confirmed: {
      title: "Order confirmed",
      body: "Your order #{{number}} has been confirmed",
    },
    order_rejected: {
      title: "Order declined",
      body: "Your order #{{number}} was declined",
    },
    order_preparing: {
      title: "Being prepared",
      body: "Order #{{number}} is being prepared",
    },
    order_ready: {
      title: "Order ready",
      body: "Order #{{number}} is ready and waiting for a courier",
    },
    order_cancelled: {
      title: "Order cancelled",
      body: "Your order #{{number}} was cancelled by the restaurant",
    },
    order_assigned: {
      title: "Courier assigned",
      body: "A courier is picking up order #{{number}}",
    },
    order_picked_up: {
      title: "Picked up",
      body: "Order #{{number}} is on its way from the restaurant",
    },
    order_in_transit: {
      title: "On the way",
      body: "Order #{{number}} is out for delivery",
    },
    order_delivered: {
      title: "Delivered",
      body: "Order #{{number}} has been delivered",
    },
    rejectedFallbackReason: "Declined by the restaurant",
    cancelledFallbackReason: "Cancelled by the restaurant",
    noReason: "No reason provided",
    rejectedWithReason: "Your order #{{number}} was declined: {{reason}}",
    cancelledWithReason: "Your order #{{number}} was cancelled: {{reason}}",
    cancelledByCustomer: "Order #{{number}} was cancelled by the customer",
    readyForPickup: "Your order #{{number}} is ready for pickup",
    newOrderValue: "Order #{{number}} - {{total}}",
    channelOrders: "Order updates",
    channelOrdersHint: "Confirmations, pickups and deliveries for orders in progress.",
    channelPromotions: "Offers and news",
    channelPromotionsHint: "Deals and new restaurants. Never order updates.",
  },
};
