/** Discovery, search and the home feed. */

export default {
  pageHeading: "Restaurants and dishes delivering to {{address}}",
  categoryRailLabel: "Filter by category",

  search: {
    placeholder: "Search restaurants or dishes",
    label: "Search restaurants and dishes",
    clear: "Clear search",
    hintPlaceholder: "Try a restaurant, a cuisine or a dish",
    startOver: "Start a new search",
    removeRecent: "Remove {{term}} from recent searches",
    announce: "{{restaurants}} and {{dishes}} found",
    matches_one: "{{count}} match",
    matches_other: "{{count}} matches",
    error: {
      title: "Search is not responding",
      description: "We could not run that search. Your query is still here - try again.",
    },
    noFilterMatches: {
      title: "No matches with these filters",
      description: "Your filters ruled out every result. Loosening them should bring some back.",
    },
    heading: "Search",
    resultsFor: "Results for “{{query}}”",
    recent: "Recent searches",
    clearRecent: "Clear recent searches",
    noResults: {
      title: 'Nothing found for "{{query}}"',
      description:
        "Check the spelling, try a broader term, or browse what is delivering to you right now.",
    },
    prompt: {
      title: "What are you after?",
      description: "Search by restaurant, dish or cuisine.",
    },
    restaurantsHeading: "Restaurants",
    dishesHeading: "Dishes",
    countRestaurants_one: "{{count}} restaurant",
    countRestaurants_other: "{{count}} restaurants",
    countDishes_one: "{{count}} dish",
    countDishes_other: "{{count}} dishes",
  },

  feed: {
    allTitle: "All dishes near you",
    allDishes: "All dishes",
    allSubtitle: "Everything delivering to you",
    loadError: "We could not load dishes for this category.",
    loadMoreError: "Could not load more dishes.",
    emptyAllTitle: "No dishes nearby",
    emptyAllBody:
      "No restaurant is delivering to this address right now. Try a different address.",
    emptyCategoryTitle: "No {{category, lowercase}} nearby",
    emptyCategoryBody:
      "Nothing in this category is available at your address right now.",
    showAll: "Show all dishes",
    loadMore: "Load more",
    loadingMore: "Loading more dishes",
  },

  filters: {
    openNow: "Open now",
    liveNow: "Live now",
    browseDeals: "Browse deals",
    freeDelivery: "Free delivery",
    sortBy: "Sort by",
    clearAll: "Clear filters",
    clear_one: "Clear filter",
    clear_other: "Clear {{count}} filters",
  },
};
