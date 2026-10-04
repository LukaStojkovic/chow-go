import { describe, expect, it } from "vitest";

import { DEFAULT_SEARCH_FILTERS, applyRestaurantFilters, countActiveFilters } from "../src/searchFilters.js";

const restaurants = [
  { id: "a", availability: "open", deliveryFee: 0, deliveryEstimate: "20-30 min", rating: 4.1, distance: 900 },
  { id: "b", availability: "closed", deliveryFee: 250, deliveryEstimate: "40-60", rating: 4.8, distance: 300 },
  { id: "c", availability: "open", deliveryFee: 250, deliveryEstimate: "soon", rating: null, distance: null },
  { id: "d", availability: "open", deliveryFee: 0, deliveryEstimate: "15-25", rating: 3.9, distance: 1500 },
];

const ids = (list) => list.map((r) => r.id);
const withFilters = (extra) => ({ ...DEFAULT_SEARCH_FILTERS, ...extra });

describe("countActiveFilters", () => {
  it("counts everything but sort", () => {
    expect(countActiveFilters(DEFAULT_SEARCH_FILTERS)).toBe(0);
    expect(countActiveFilters(withFilters({ sort: "rating" }))).toBe(0);
    expect(countActiveFilters(withFilters({ openNow: true, freeDelivery: true, maxDeliveryTime: "30" }))).toBe(3);
  });
});

describe("applyRestaurantFilters", () => {
  it("keeps the backend's order for relevance and does not mutate the input", () => {
    const result = applyRestaurantFilters(restaurants, DEFAULT_SEARCH_FILTERS);
    expect(ids(result)).toEqual(["a", "b", "c", "d"]);
    expect(result).not.toBe(restaurants);
  });

  it("filters open and free-delivery restaurants", () => {
    expect(ids(applyRestaurantFilters(restaurants, withFilters({ openNow: true })))).toEqual(["a", "c", "d"]);
    expect(ids(applyRestaurantFilters(restaurants, withFilters({ freeDelivery: true })))).toEqual(["a", "d"]);
  });

  it("filters by the upper bound of the estimate and keeps unparseable ones", () => {
    expect(ids(applyRestaurantFilters(restaurants, withFilters({ maxDeliveryTime: "30" })))).toEqual([
      "a",
      "c",
      "d",
    ]);
  });

  it("sorts by rating, delivery time and distance with missing values last", () => {
    expect(ids(applyRestaurantFilters(restaurants, withFilters({ sort: "rating" })))).toEqual(["b", "a", "d", "c"]);
    expect(ids(applyRestaurantFilters(restaurants, withFilters({ sort: "delivery_time" })))).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
    expect(ids(applyRestaurantFilters(restaurants, withFilters({ sort: "distance" })))).toEqual(["b", "a", "d", "c"]);
  });
});
