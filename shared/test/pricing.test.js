import { describe, expect, it } from "vitest";

import { PRICING, breakdownFromOrder, buildPriceBreakdown, pricingFor } from "../src/adapters/pricing.js";

describe("pricingFor", () => {
  it("returns the table for the restaurant's currency", () => {
    expect(pricingFor("eur")).toMatchObject({ currency: "EUR", deliveryFee: 2.5, serviceFee: 1.5, priorityFee: 1.99 });
    expect(pricingFor("RSD")).toMatchObject({ currency: "RSD", deliveryFee: 250, serviceFee: 150, priorityFee: 200 });
  });

  it("falls back to the default currency", () => {
    expect(pricingFor("GBP").currency).toBe("RSD");
    expect(pricingFor(undefined).currency).toBe("RSD");
    expect(PRICING.currency).toBe("RSD");
  });

  it("never advertises a minimum order or tax", () => {
    expect(PRICING.minimumOrder).toBeNull();
    expect(PRICING.taxRate).toBe(0);
  });
});

describe("buildPriceBreakdown", () => {
  it("adds the flat fees to a standard order", () => {
    expect(buildPriceBreakdown({ subtotal: 1000, currency: "RSD" })).toEqual({
      currency: "RSD",
      subtotal: 1000,
      deliveryFee: 250,
      serviceFee: 150,
      priorityFee: 0,
      tip: 0,
      discount: 0,
      tax: 0,
      total: 1400,
    });
  });

  it("adds the priority fee, tip and subtracts a discount", () => {
    const view = buildPriceBreakdown({
      subtotal: 1000,
      deliveryType: "priority",
      tip: 100,
      discount: 300,
      currency: "RSD",
    });
    expect(view.priorityFee).toBe(200);
    expect(view.total).toBe(1400);
  });

  it("sums decimal currencies without float drift", () => {
    const view = buildPriceBreakdown({ subtotal: 10.1, deliveryType: "priority", tip: 1, currency: "EUR" });
    expect(view.total).toBe(17.09);
  });

  it("clamps negative or invalid inputs and never goes below zero", () => {
    expect(buildPriceBreakdown({ subtotal: NaN, currency: "RSD" }).total).toBe(400);
    expect(buildPriceBreakdown({ subtotal: 100, tip: -50, currency: "RSD" }).tip).toBe(0);
    expect(buildPriceBreakdown({ subtotal: 100, discount: 10_000, currency: "RSD" }).total).toBe(0);
  });
});

describe("breakdownFromOrder", () => {
  it("returns an empty breakdown for a missing order", () => {
    expect(breakdownFromOrder(null).subtotal).toBe(0);
  });

  it("reads an itemised order straight off its fields", () => {
    const view = breakdownFromOrder({
      currency: "EUR",
      subtotal: 20,
      deliveryFee: 2.5,
      serviceFee: 1.5,
      priorityFee: 0,
      tip: 1,
      discount: 2,
      total: 23,
      promo: { code: "SAVE-2" },
    });
    expect(view).toMatchObject({
      currency: "EUR",
      serviceFee: 1.5,
      priorityFee: 0,
      discount: 2,
      promoCode: "SAVE-2",
      total: 23,
    });
  });

  it("recovers the service fee of a legacy order as the unaccounted remainder", () => {
    const view = breakdownFromOrder({ currency: "EUR", subtotal: 10, deliveryFee: 2.5, total: 14 });
    expect(view.serviceFee).toBe(1.5);
    expect(view.priorityFee).toBe(0);
    expect(view.promoCode).toBeNull();
  });

  it("never reports a negative remainder", () => {
    const view = breakdownFromOrder({ subtotal: 10, deliveryFee: 2.5, total: 11 });
    expect(view.serviceFee).toBe(0);
  });
});
