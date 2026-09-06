/**
 * Search filtering and sorting logic.
 *
 * Kept out of the component file so `SearchFilters.jsx` exports only a
 * component - which is what keeps fast refresh working for it.
 *
 * The search endpoint returns an unfiltered set of nearby matches (capped at
 * five restaurants server-side), so refining happens here rather than in
 * another round trip. That keeps typing responsive at this data volume.
 */

/**
 * @typedef {Object} SearchFilterState
 * @property {boolean} openNow
 * @property {boolean} freeDelivery
 * @property {string} maxDeliveryTime Minutes as a string, or "any".
 * @property {string} sort
 */

/** The state a fresh search starts from. */
export const DEFAULT_SEARCH_FILTERS = {
  openNow: false,
  freeDelivery: false,
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
  if (filters.freeDelivery) count += 1;
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
function upperBoundMinutes(estimate) {
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
  if (filters.freeDelivery) result = result.filter((r) => r.deliveryFee === 0);

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
