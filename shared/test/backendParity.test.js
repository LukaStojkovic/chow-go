import { describe, expect, it } from "vitest";

import * as backendPromotion from "../../backend/utils/promotion.js";
import { ACTIVE_STATUSES, canCustomerCancel } from "../../backend/utils/orderStatus.js";
import { ACTIVE_STATUS_FILTER, ORDER_STATUSES, toOrderView } from "../src/adapters/order.js";
import { PROMOTION_LIMITS, isPromotionLive, resolvePromotion } from "../src/promotion.js";

const NOW = new Date("2026-06-15T12:00:00Z");

describe("order status rules match backend/utils/orderStatus.js", () => {
  it.each(ORDER_STATUSES)("canCancel agrees for %s", (status) => {
    expect(toOrderView({ _id: "x", status }).canCancel).toBe(canCustomerCancel(status));
  });

  it("uses the same active statuses", () => {
    expect(ACTIVE_STATUS_FILTER.split(",")).toEqual(ACTIVE_STATUSES);
  });
});

describe("promotion rules match backend/utils/promotion.js", () => {
  it("uses the same limits", () => {
    expect(PROMOTION_LIMITS.minPrice).toBe(backendPromotion.MIN_PROMOTIONAL_PRICE);
    expect(PROMOTION_LIMITS.maxPercentOff).toBe(backendPromotion.MAX_PERCENTAGE_OFF);
    expect(PROMOTION_LIMITS.maxLabelLength).toBe(backendPromotion.MAX_PROMOTION_LABEL);
  });

  const cases = [
    [10, { isActive: true, type: "percentage", value: 25 }],
    [12.99, { isActive: true, type: "percentage", value: 33 }],
    [10, { isActive: true, type: "fixed", value: 3.33 }],
    [10, { isActive: true, type: "fixed", value: 20 }],
    [1, { isActive: true, type: "percentage", value: 0.01 }],
    [10, { isActive: false, type: "percentage", value: 25 }],
    [10, { isActive: true, type: "percentage", value: 25, endsAt: NOW.toISOString() }],
    [10, { isActive: true, type: "percentage", value: 25, startsAt: "2026-07-01T00:00:00Z" }],
    [0, { isActive: true, type: "percentage", value: 25 }],
  ];

  it.each(cases)("price %s with %o resolves identically", (price, promotion) => {
    const client = resolvePromotion(price, promotion, NOW);
    expect(isPromotionLive(promotion, NOW)).toBe(backendPromotion.isPromotionLive(promotion, NOW));
    expect(client.price).toBe(backendPromotion.effectivePrice(price, promotion, NOW));
    expect(client.discountPercent).toBe(backendPromotion.discountPercent(price, promotion, NOW));
  });
});
