/** Basket and checkout. */

export default {
  title: "Basket",
  open: "Open basket",
  a11yWithCount: "Basket, {{items}}",
  a11yEmpty: "Basket, empty",
  openWithCount: "View basket, {{items}}, {{total}}",
  panelDescription: "Review and edit the items in your basket before checking out.",
  loading: "Loading your basket",
  viewMenu: "View menu",
  soldOutBody: "The kitchen has run out of this today. It should be back tomorrow.",
  kitchenNote: "Note for the kitchen (optional)",
  kitchenNotePlaceholder: "No onions, extra napkins, allergies to flag...",
  kitchenNoteHint: "Optional - allergies, preferences, anything the kitchen should know.",
  kitchenNoteShortPlaceholder: "No pickles, extra spicy…",
  itemCount_one: "{{count}} item",
  itemCount_other: "{{count}} items",

  empty: {
    title: "Your basket is empty",
    description: "Add something from a restaurant near you and it will show up here.",
    action: "Browse restaurants",
  },

  line: {
    quantity: "Quantity",
    increase: "Add one more",
    decrease: "Remove one",
    remove: "Remove {{name}}",
    removed: "{{name}} removed from your basket.",
    unavailable: "No longer available",
    instructions: "Special instructions:",
    deal: "Deal",
    addFailedLong: "Could not add this item. Try again.",
    updateFailedLong: "Could not update the quantity.",
    removeFailedLong: "Could not remove this item.",
    clearFailedLong: "Could not empty your basket.",
    instructionsHint:
      "The restaurant will do its best, but cannot always accommodate every request.",
    reorderPartialWithSkipped:
      "{{added}} added. {{skipped}} no longer available.",
  },

  summary: {
    subtotal: "Subtotal",
    deliveryFee: "Delivery",
    serviceFee: "Service fee",
    priorityFee: "Priority delivery",
    tip: "Courier tip",
    tax: "Tax",
    total: "Total",
    includesFees: "Includes all fees",
    title: "Price breakdown",
    extrasAtCheckout: "Tip and any priority fee are added at checkout.",
    savings: "You saved {{amount}}",
    discount: "Discount",
    hintLabel: "What is the {{label}}? {{hint}}",
    deliveryFeeHint: "A flat fee that goes towards getting your order to you.",
    serviceFeeHint: "Covers running the platform, payment handling and support.",
    priorityFeeHint: "Moves your order to the front of the courier queue.",
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
    confirm: "Empty basket and continue",
    keep: "Keep my basket",
    anotherRestaurant: "another restaurant",
    addBody: "Your basket has items from {{current}}. Adding this dish will empty it.",
    reorderBody: "Your basket has items from {{current}}. Reordering will empty it.",
    emptyAndAdd: "Empty basket and add",
    emptyAndReorder: "Empty basket and reorder",
    body: "Your basket has items from <0>{{current}}</0>. You can only order from one restaurant at a time, so those items will be removed.",
    bodyWithNext: "Your basket has items from <0>{{current}}</0>. You can only order from one restaurant at a time, so those items will be removed and replaced with your order from {{next}}.",
  },

  heading: "Your basket has items from another restaurant",
  addedToBasket: "Added to your basket",
  addItem: "Add · {{price}}",
  addFailed: "Could not add this item",
  replaceFailed: "Could not replace your basket",
  updateFailed: "Could not update the basket",
  removeFailed: "Could not remove the item",
  removeItem: "Remove item",
  decreaseQuantity: "Decrease quantity",
  increaseQuantity: "Increase quantity",
  reorderNoneAvailable: "None of these items are available any more",
  reorderPartial_one: "{{count}} item added",
  reorderPartial_few: "{{count}} items added",
  reorderPartial_other: "{{count}} items added",
  reorderUnavailable: "{{names}} no longer available.",
  added: "{{name}} added to your basket.",
  goToCheckout: "Go to checkout",
  chooseAddress: "Choose a delivery address",
  orderingFrom: "Ordering from",
  addMore: "Add more items",

  checkout: {
    title: "Checkout",
    loading: "Loading your order",
    placeOrder: "Place order",
    editOrder: "Edit your order",
    secureHint: "Your details are sent over an encrypted connection.",
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
      emptyTitle: "No delivery address yet",
      emptyDescription: "Add an address so the courier knows where to bring your order.",
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
      shortDescription: "100% goes to the person who brings it",
    },

    notes: {
      title: "Delivery instructions",
      description: "Anything the restaurant or the courier should know.",
      label: "Delivery instructions",
      placeholder:
        "Buzzer is broken - please call. Leave at the door if there is no answer.",
      count: "{{used}}/{{max}} characters",
      shortPlaceholder: "Allergies, buzzer code, anything else",
    },
  },
};
