/** Restaurant page, menu, and opening hours. */

export default {
  availability: {
    notAccepting: "This restaurant is not accepting orders at the moment.",
    closedUntil: "Closed right now. Opens again at {{time}}.",
    closedNoSlot: "Closed right now. Check the opening hours for the next slot.",
    closedNow: "Closed now",
    openNow: "Open now",
    open: "Open",
    closed: "Closed",
    unavailable: "Unavailable",
  },

  hours: {
    heading: "Opening hours",
    unpublished: "This restaurant has not published its opening hours.",
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
    sectionNav: "Menu sections",
    filterLabel: "Filter this menu",
    filterPlaceholder: "Filter menu",
    filterClear: "Clear menu filter",
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
    emptySearch: 'Nothing matching "{{query}}"',
    emptyTitle: "This menu is empty",
    emptySearchHint: "Try a shorter term, or clear the filter to see the whole menu.",
    emptyHint: "The restaurant has not published any dishes yet. Check back soon.",
    browseWhileClosed:
      "You can still browse the menu - ordering will open again when the kitchen does.",
    soldOutShort: "Sold out.",
    closedShort: "Restaurant closed.",
    unavailableShort: "Unavailable",
    browseWhileClosedSuffix:
      "You can still browse the menu - ordering will open again when the kitchen does.",
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
    viewInfo: "Hours & info",
    delivery: "Delivery",
    sheetTitle: "{{name}} - hours and information",
    sheetDescription: "Opening hours, address and delivery details.",
    estimatedDelivery: "Estimated delivery {{value}}",
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

  loading: "Loading restaurant",

  error: {
    title: "We could not load this restaurant",
    description: "Check your connection and try again.",
    loadDescription: "It may have been removed, or the connection dropped on the way.",
  },

  favourites: {
    title: "Favourites",
    subtitle: "Places you saved for later.",
    subtitleEmpty: "Restaurants you save appear here",
    saveShort: "Save to favourites",
    removeShort: "Remove from favourites",
    guestHint: "Keep the places you order from most in one list.",
    loading: "Loading your saved restaurants",
    savedCount_one: "{{count}} saved restaurant",
    savedCount_other: "{{count}} saved restaurants",
    empty: {
      title: "No favourites yet",
      description: "Tap the heart on any restaurant to save it here for next time.",
      action: "Find restaurants",
    },
    saved: "Saved to favourites",
    removedShort: "Removed from favourites",
    toggleFailed: "Could not update your favourites. Try again.",
  },

  reorder: {
    heading: "Order again",
    subtitle: "Your recent deliveries, one tap away",
    adding: "Adding to basket",
    shortSubtitle: "Straight back into your basket",
    fromNamed: "Order again from {{name}}",
  },

  nearby: {
    heading: "Restaurants near you",
    count_one: "{{count}} delivering to your address",
    count_other: "{{count}} delivering to your address",
    loadError: "We could not load restaurants near you.",
    trendingHeading: "Trending near you",
    trendingSubtitle: "Top picks close to your address",
    empty: {
      title: "Nothing delivering here yet",
      description:
        "No restaurant covers this address right now. Try another saved address, or check back a little later.",
    },
  },

  newInTown: {
    heading: "New in town",
    subtitle: "Joined in the last 30 days and delivering to you",
    shortSubtitle: "Just started delivering",
  },

  popular: {
    heading: "Popular right now",
    subtitle: "Most ordered near your address this week",
    loadError: "We could not load popular dishes.",
    shortHeading: "Popular quick bites",
    shortSubtitle: "Most ordered around you",
  },

  promotions: {
    heading: "Deals near you",
    subtitle: "Reduced by the restaurants delivering to your address",
    loadError: "Could not refresh the current deals.",
    shortHeading: "Deals",
    shortSubtitle: "Marked down right now",
    priceHint: "The discount is already in the price you see.",
    badge: "{{value}}% off",
    srPrefix: "Promotion:",
    save: "Save",
  },
};
