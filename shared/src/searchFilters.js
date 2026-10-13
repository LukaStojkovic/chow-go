/**
 * Search filtering and sorting logic.
 *
 * Kept out of the component file so `SearchFilters.jsx` exports only a
 * component - which is what keeps fast refresh working for it.
 *
 * The search endpoint filters, sorts and pages on the server; `toSearchParams`
 * turns this state into its query string. `applyRestaurantFilters` is the same
 * rule for a list already in hand.
 */

/**
 * @typedef {Object} SearchFilterState
 * @property {boolean} openNow
 * @property {string} maxDeliveryTime Minutes as a string, or "any".
 * @property {string} sort
 */

/** The state a fresh search starts from. */
export const DEFAULT_SEARCH_FILTERS = {
  openNow: false,
  maxDeliveryTime: "any",
  sort: "relevance",
};

/**
 * How many filters differ from the defaults. Sort is excluded - it always has
 * a value, so counting it would mean the "clear" control never disappears.
 *
 * @param {SearchFilterState} filters
 * @returns {number}
 */
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.openNow) count += 1;
  if (filters.maxDeliveryTime !== "any") count += 1;
  return count;
}

/**
 * Delivery estimates are free text ("30-45 min"). The upper bound is the
 * number that matters to someone deciding whether to wait.
 *
 * @param {string} estimate
 * @returns {number} Minutes, or Infinity when nothing parses.
 */
export function upperBoundMinutes(estimate) {
  const numbers = String(estimate || "").match(/\d+/g);
  return numbers?.length ? Number(numbers[numbers.length - 1]) : Infinity;
}

/**
 * Apply the filters and sort to a set of restaurants.
 *
 * @param {import("@chowgo/shared/adapters/types").RestaurantView[]} restaurants
 * @param {SearchFilterState} filters
 * @returns {import("@chowgo/shared/adapters/types").RestaurantView[]}
 */
export function applyRestaurantFilters(restaurants, filters) {
  let result = restaurants;

  if (filters.openNow) result = result.filter((r) => r.availability === "open");

  if (filters.maxDeliveryTime !== "any") {
    const limit = Number(filters.maxDeliveryTime);
    result = result.filter((restaurant) => {
      const upper = upperBoundMinutes(restaurant.deliveryEstimate);
      // An unparseable estimate is kept rather than hidden: dropping a
      // restaurant because its seller typed the time oddly is worse than
      // showing one that might be slightly over.
      return upper === Infinity || upper <= limit;
    });
  }

  const sorted = [...result];
  switch (filters.sort) {
    case "rating":
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "delivery_time":
      sorted.sort(
        (a, b) => upperBoundMinutes(a.deliveryEstimate) - upperBoundMinutes(b.deliveryEstimate),
      );
      break;
    case "distance":
      sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      break;
    default:
      // "relevance" is the order the backend returned; leave it alone.
      break;
  }

  return sorted;
}

export const SEARCH_SORTS = ["relevance", "rating", "delivery_time", "distance"];

/** The filter state as /discover/search query params, leaving defaults out. */
export function toSearchParams(filters = DEFAULT_SEARCH_FILTERS) {
  const params = {};
  if (filters.openNow) params.openNow = "true";
  if (filters.maxDeliveryTime && filters.maxDeliveryTime !== "any") params.maxDeliveryTime = String(filters.maxDeliveryTime);
  if (filters.sort && filters.sort !== "relevance") params.sort = filters.sort;
  return params;
}

/** Reads query params back into filter state, ignoring anything unknown. */
export function parseSearchFilters(query = {}) {
  const minutes = Number(query.maxDeliveryTime);
  return {
    openNow: query.openNow === true || query.openNow === "true",
    maxDeliveryTime: Number.isInteger(minutes) && minutes > 0 && minutes <= 180 ? String(minutes) : "any",
    sort: SEARCH_SORTS.includes(query.sort) ? query.sort : "relevance",
  };
}
