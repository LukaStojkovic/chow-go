/** Basket and checkout. */

export default {
  title: "Basket",
  open: "Open basket",
  a11yWithCount: "Basket, {{items}}",
  a11yEmpty: "Basket, empty",
  itemCount_one: "{{count}} item",
  itemCount_other: "{{count}} items",

  empty: {
    title: "Your basket is empty",
    description: "Add a dish and it will show up here.",
    action: "Browse restaurants",
  },

  line: {
    quantity: "Quantity",
    increase: "Add one more",
    decrease: "Remove one",
    remove: "Remove {{name}}",
    removed: "{{name}} removed from your basket.",
    unavailable: "No longer available",
  },

  summary: {
    title: "Order summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery",
    serviceFee: "Service fee",
    priorityFee: "Priority delivery",
    tip: "Courier tip",
    tax: "Tax",
    total: "Total",
    savings: "You saved {{amount}}",
  },

  clear: {
    action: "Empty basket",
    title: "Empty your basket?",
    description: "Every dish in it will be removed. This cannot be undone.",
    confirm: "Yes, empty it",
    success: "Your basket is empty.",
  },

  differentRestaurant: {
    title: "Start a new basket?",
    description:
      "Your basket has dishes from {{current}}. Adding this will empty it and start again with {{next}}.",
    confirm: "Start new basket",
  },

  added: "{{name}} added to your basket.",
  goToCheckout: "Go to checkout",

  checkout: {
    title: "Checkout",
    loading: "Loading your order",
    placeOrder: "Place order",
    placing: "Placing your order",
    terms:
      "Placing an order means you accept our Terms of Service and Privacy Policy. You can cancel free of charge until the courier collects your food.",

    error: {
      title: "Checkout hit a problem",
      description:
        "Your basket is safe and nothing has been charged. Try again in a moment.",
    },

    empty: {
      title: "There is nothing to check out",
      description:
        "Your basket is empty. Find something you fancy and it will show up here.",
      action: "Browse restaurants",
    },

    blockers: {
      address: "Choose a delivery address to continue.",
      payment: "Choose how you would like to pay.",
      restaurant: "We lost track of the restaurant - reload the page.",
    },

    address: {
      title: "Delivery address",
      description: "Where should the courier bring your order?",
      change: "Change address",
      add: "Add an address",
      none: "No address selected yet.",
    },

    speed: {
      title: "Delivery speed",
      description: "Usually {{estimate}} from this restaurant.",
      legend: "Choose a delivery speed",
      included: "Included",
    },

    payment: {
      title: "Payment",
      description: "You pay when your order arrives.",
      legend: "Choose a payment method",
    },

    tip: {
      title: "Tip your courier",
      description: "Optional, and it all goes to the person who brings your order.",
      none: "No tip",
      customLabel: "Custom tip amount",
      customPlaceholder: "Other",
    },

    notes: {
      title: "Delivery instructions",
      description: "Anything the restaurant or the courier should know.",
      label: "Delivery instructions",
      placeholder:
        "Buzzer is broken - please call. Leave at the door if there is no answer.",
      count: "{{used}}/{{max}} characters",
    },
  },
};
