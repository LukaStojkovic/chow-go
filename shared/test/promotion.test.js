import { describe, expect, it } from "vitest";

import { isPromotionLive, previewPromotion, resolvePromotion } from "../src/promotion.js";

const NOW = new Date("2026-06-15T12:00:00Z");
const live = (extra) => ({ isActive: true, type: "percentage", value: 25, ...extra });

describe("isPromotionLive", () => {
  it("requires isActive === true and a positive value", () => {
    expect(isPromotionLive(null, NOW)).toBe(false);
    expect(isPromotionLive(live({ isActive: "true" }), NOW)).toBe(false);
    expect(isPromotionLive(live({ value: 0 }), NOW)).toBe(false);
    expect(isPromotionLive(live(), NOW)).toBe(true);
  });

  it("respects the start bound", () => {
    expect(isPromotionLive(live({ startsAt: "2026-06-16T00:00:00Z" }), NOW)).toBe(false);
    expect(isPromotionLive(live({ startsAt: NOW.toISOString() }), NOW)).toBe(true);
  });

  it("treats the end bound as exclusive", () => {
    expect(isPromotionLive(live({ endsAt: NOW.toISOString() }), NOW)).toBe(false);
    expect(isPromotionLive(live({ endsAt: "2026-06-15T12:00:01Z" }), NOW)).toBe(true);
  });
});

describe("resolvePromotion", () => {
  it("applies a percentage discount", () => {
    expect(resolvePromotion(10, live(), NOW)).toEqual({ price: 7.5, basePrice: 10, discountPercent: 25 });
  });

  it("applies a fixed discount", () => {
    expect(resolvePromotion(10, live({ type: "fixed", value: 3 }), NOW)).toEqual({
      price: 7,
      basePrice: 10,
      discountPercent: 30,
    });
  });

  it("never prices a dish under the 0.50 floor", () => {
    expect(resolvePromotion(10, live({ type: "fixed", value: 20 }), NOW).price).toBe(0.5);
    expect(resolvePromotion(10, live({ type: "fixed", value: 9.8 }), NOW)).toEqual({
      price: 0.5,
      basePrice: 10,
      discountPercent: 95,
    });
  });

  it("reports no discount when the promotion is not live", () => {
    expect(resolvePromotion(10, live({ isActive: false }), NOW)).toEqual({
      price: 10,
      basePrice: null,
      discountPercent: 0,
    });
  });

  it("reports no discount when rounding leaves the price unchanged", () => {
    expect(resolvePromotion(1, live({ value: 0.01 }), NOW)).toEqual({
      price: 1,
      basePrice: null,
      discountPercent: 0,
    });
  });

  it("handles a zero or missing price", () => {
    expect(resolvePromotion(0, live(), NOW).price).toBe(0);
    expect(resolvePromotion(undefined, live(), NOW).price).toBe(0);
  });
});

describe("previewPromotion", () => {
  it("previews valid input typed into the form", () => {
    expect(previewPromotion(10, { type: "percentage", value: "20" })).toEqual({
      isValid: true,
      discounted: 8,
      percentOff: 20,
      saving: 2,
    });
    expect(previewPromotion(12.99, { type: "fixed", value: "3" })).toEqual({
      isValid: true,
      discounted: 9.99,
      percentOff: 23,
      saving: 3,
    });
  });

  it("rejects anything the backend would refuse", () => {
    expect(previewPromotion(10, { type: "percentage", value: 91 }).isValid).toBe(false);
    expect(previewPromotion(10, { type: "fixed", value: 9.6 }).isValid).toBe(false);
    expect(previewPromotion(10, { type: "fixed", value: "" }).isValid).toBe(false);
    expect(previewPromotion(0, { type: "fixed", value: 1 }).isValid).toBe(false);
    expect(previewPromotion(10, undefined).isValid).toBe(false);
  });
});
