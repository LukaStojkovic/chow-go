import { describe, expect, it } from "vitest";

import {
  computePromoDiscount,
  isValidCode,
  normalizeCode,
  promoDiscountLabel,
} from "../src/promoCode.js";

describe("normalizeCode", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizeCode(" sum mer-10 ")).toBe("SUMMER-10");
  });

  it("returns an empty string for non-strings", () => {
    expect(normalizeCode(null)).toBe("");
    expect(normalizeCode(1234)).toBe("");
  });
});

describe("isValidCode", () => {
  it("enforces length 4-24", () => {
    expect(isValidCode("abc")).toBe(false);
    expect(isValidCode("abcd")).toBe(true);
    expect(isValidCode("A".repeat(24))).toBe(true);
    expect(isValidCode("A".repeat(25))).toBe(false);
  });

  it("allows only letters, digits and hyphens", () => {
    expect(isValidCode("SAVE-10")).toBe(true);
    expect(isValidCode("SAVE_10")).toBe(false);
    expect(isValidCode("SAVE!10")).toBe(false);
  });
});

describe("computePromoDiscount", () => {
  it("returns 0 without a promo or for an unknown type", () => {
    expect(computePromoDiscount({ promo: null, subtotal: 100 })).toBe(0);
    expect(computePromoDiscount({ promo: { type: "bogus", value: 10 }, subtotal: 100 })).toBe(0);
  });

  it("floors a percentage discount to the cent", () => {
    const promo = { type: "percentage", value: 10 };
    expect(computePromoDiscount({ promo, subtotal: 33.33 })).toBe(3.33);
    expect(computePromoDiscount({ promo, subtotal: 0.09 })).toBe(0);
  });

  it("caps a percentage at 90% and at maxDiscount", () => {
    expect(computePromoDiscount({ promo: { type: "percentage", value: 150 }, subtotal: 100 })).toBe(90);
    expect(
      computePromoDiscount({ promo: { type: "percentage", value: 50, maxDiscount: 20 }, subtotal: 100 }),
    ).toBe(20);
  });

  it("ignores a non-positive maxDiscount", () => {
    expect(
      computePromoDiscount({ promo: { type: "percentage", value: 50, maxDiscount: 0 }, subtotal: 100 }),
    ).toBe(50);
  });

  it("never discounts a fixed amount past the subtotal or below zero", () => {
    expect(computePromoDiscount({ promo: { type: "fixed", value: 15 }, subtotal: 10 })).toBe(10);
    expect(computePromoDiscount({ promo: { type: "fixed", value: 4.5 }, subtotal: 10 })).toBe(4.5);
    expect(computePromoDiscount({ promo: { type: "fixed", value: -5 }, subtotal: 10 })).toBe(0);
  });

  it("treats a negative subtotal as zero", () => {
    expect(computePromoDiscount({ promo: { type: "fixed", value: 5 }, subtotal: -20 })).toBe(0);
  });

  it("makes free_delivery equal to the delivery fee, independent of subtotal", () => {
    const promo = { type: "free_delivery" };
    expect(computePromoDiscount({ promo, subtotal: 0, deliveryFee: 250 })).toBe(250);
    expect(computePromoDiscount({ promo, subtotal: 10, deliveryFee: 2.5 })).toBe(2.5);
    expect(computePromoDiscount({ promo, subtotal: 10 })).toBe(0);
  });
});

describe("promoDiscountLabel", () => {
  const t = (key, options) => `${key}${options ? ` ${JSON.stringify(options)}` : ""}`;
  const formatPrice = (amount, { currency }) => `${amount} ${currency}`;

  it("is empty without a promo", () => {
    expect(promoDiscountLabel(t, null, formatPrice)).toBe("");
  });

  it("picks the key for each type and formats amounts in the promo's currency", () => {
    expect(promoDiscountLabel(t, { type: "free_delivery" }, formatPrice)).toBe(
      "promo:discount.free_delivery",
    );
    expect(promoDiscountLabel(t, { type: "fixed", value: 300, currency: "RSD" }, formatPrice)).toBe(
      'promo:discount.fixed {"amount":"300 RSD"}',
    );
    expect(promoDiscountLabel(t, { type: "percentage", value: 15 }, formatPrice)).toBe(
      'promo:discount.percentage {"value":15}',
    );
    expect(
      promoDiscountLabel(t, { type: "percentage", value: 15, maxDiscount: 5, currency: "EUR" }, formatPrice),
    ).toBe('promo:discount.percentageCapped {"value":15,"max":"5 EUR"}');
  });
});
