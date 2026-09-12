/** Restaurant page, menu, and opening hours. */

export default {
  availability: {
    notAccepting: "This restaurant is not accepting orders at the moment.",
    closedUntil: "Closed right now. Opens again at {{time}}.",
    closedNoSlot: "Closed right now. Check the opening hours for the next slot.",
    open: "Open",
    closed: "Closed",
    unavailable: "Unavailable",
  },

  hours: {
    heading: "Opening hours",
    closed: "Closed",
    allDay: "Open 24 hours",
    range: "{{from}} - {{to}}",
    today: "Today",
    overnight: "Runs into the next morning",
  },

  menu: {
    heading: "Menu",
    untitledDish: "Menu item",
    otherCategory: "Other",
    sectionNav: "Jump to a menu section",
    empty: {
      title: "Nothing on the menu yet",
      description: "This restaurant has not added any dishes.",
    },
    searchPlaceholder: "Search this menu",
    noMatches: "Nothing on this menu matches “{{query}}”.",
    soldOut: "Sold out",
    addToBasket: "Add to basket",
    addNamed: "Add {{name}} to basket",
    closedCannotAdd: "Restaurant closed",
  },

  info: {
    heading: "Restaurant information",
    about: "About",
    address: "Address",
    phone: "Phone",
    cuisine: "Cuisine",
    deliveryEstimate: "Delivery time",
    deliveryFee: "Delivery fee",
    distance: "Distance",
    viewInfo: "Restaurant info",
  },

  favourite: {
    add: "Add {{name}} to favourites",
    remove: "Remove {{name}} from favourites",
    added: "{{name}} added to your favourites.",
    removed: "{{name}} removed from your favourites.",
  },

  notFound: {
    title: "Restaurant not found",
    description: "This restaurant does not exist, or it is no longer listed.",
    action: "Back to browsing",
  },

  error: {
    title: "We could not load this restaurant",
    description: "Check your connection and try again.",
  },

  favourites: {
    title: "Favourites",
    subtitle: "Places you saved for later.",
    subtitleEmpty: "Restaurants you save appear here",
    loading: "Loading your saved restaurants",
    savedCount_one: "{{count}} saved restaurant",
    savedCount_other: "{{count}} saved restaurants",
    empty: {
      title: "No favourites yet",
      description: "Tap the heart on any restaurant to save it here for next time.",
      action: "Find restaurants",
    },
  },

  reorder: {
    heading: "Order again",
    subtitle: "Your recent deliveries, one tap away",
    adding: "Adding to basket",
  },

  nearby: {
    heading: "Restaurants near you",
    count_one: "{{count}} delivering to your address",
    count_other: "{{count}} delivering to your address",
    loadError: "We could not load restaurants near you.",
    empty: {
      title: "Nothing delivering here yet",
      description:
        "No restaurant covers this address right now. Try another saved address, or check back a little later.",
    },
  },

  newInTown: {
    heading: "New in town",
    subtitle: "Joined in the last 30 days and delivering to you",
  },

  popular: {
    heading: "Popular right now",
    subtitle: "Most ordered near your address this week",
    loadError: "We could not load popular dishes.",
  },

  promotions: {
    heading: "Deals near you",
    subtitle: "Reduced by the restaurants delivering to your address",
    loadError: "Could not refresh the current deals.",
    badge: "{{value}}% off",
    srPrefix: "Promotion:",
  },
};
