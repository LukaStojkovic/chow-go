/**
 * Order copy: statuses, the customer timeline, history and rating.
 *
 * The `status` and `step` blocks are read by `adapters/order.js`, which is the
 * only place allowed to describe an order's state - a badge, a timeline node,
 * a screen-reader announcement and a push notification all resolve here, so
 * they cannot describe the same order differently.
 */

export default {
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

  detail: {
    title: "Order",
    itemsHeading: "Your order",
    summaryHeading: "Payment summary",
    deliveryHeading: "Delivery",
    notesHeading: "Delivery instructions",
    restaurantNotes: "Note for the restaurant",
    placedAt: "Placed {{value}}",
    notFound: {
      title: "Order not found",
      description: "This order does not exist, or it is not yours.",
    },
    error: {
      title: "We could not show this order",
      description: "Check your connection and try again.",
    },
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
    dismiss: "Keep my order",
    success: "Your order was cancelled.",
    tooLate:
      "This order has gone too far to cancel here - the restaurant can usually fix it fastest.",
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
    submit: "Submit rating",
    skip: "Not now",
    success: "Thanks for the feedback.",
    alreadyRated: "You have already rated this order.",
    stars_one: "{{count}} star",
    stars_other: "{{count}} stars",
  },

  confirmed: {
    title: "Order placed",
    subtitle: "{{name}} has your order and will confirm it in a moment.",
    trackAction: "Follow your order",
    homeAction: "Back to browsing",
  },

  tracking: {
    title: "Tracking",
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
  },
};
