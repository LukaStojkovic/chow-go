import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatCount,
  formatDeliveryEstimate,
  formatDistance,
  formatFee,
  formatOrderDate,
  formatPercent,
  formatPrice,
  formatRating,
  formatReviewCount,
  formatTime,
  formatDate,
  humanise,
  minutesUntil,
  titleCase,
} from "../src/format.js";
import { changeLanguage, t } from "../src/i18n/index.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("formatPrice", () => {
  it("formats in the given currency", () => {
    expect(formatPrice(12.5, { currency: "EUR" })).toBe("€12.50");
  });

  it("writes dinars without decimals", () => {
    const text = formatPrice(1234, { currency: "RSD" });
    expect(text).toContain("1,234");
    expect(text).not.toMatch(/\.\d/);
  });

  it("returns the fallback for non-numbers", () => {
    expect(formatPrice("12")).toBe("-");
    expect(formatPrice(NaN, { fallback: "n/a" })).toBe("n/a");
  });

  it("follows the UI language for separators, not the currency", async () => {
    await changeLanguage("sr");
    expect(formatPrice(1234.5, { currency: "EUR" })).toMatch(/1\.234,50/);
  });
});

describe("formatFee", () => {
  it("reads zero as free", () => {
    expect(formatFee(0)).toBe("Free");
    expect(formatFee(0, { freeLabel: "Gratis" })).toBe("Gratis");
    expect(formatFee(2.5, { currency: "EUR" })).toBe("€2.50");
    expect(formatFee(undefined)).toBe("-");
  });
});

describe("formatDistance (discovery)", () => {
  it("buckets metres to 50", () => {
    expect(formatDistance(74)).toBe("50 m");
    expect(formatDistance(76)).toBe("100 m");
  });

  it("shows one decimal under 10 km and none above", () => {
    expect(formatDistance(1234)).toBe("1.2 km");
    expect(formatDistance(12345)).toBe("12 km");
    expect(formatDistance(NaN)).toBeNull();
  });
});

describe("formatDeliveryEstimate", () => {
  it("defaults when the seller set nothing", () => {
    expect(formatDeliveryEstimate(null)).toBe("30-45 min");
  });

  it("adds a unit only when one is missing", () => {
    expect(formatDeliveryEstimate("30-45")).toBe("30-45 min");
    expect(formatDeliveryEstimate("20 min")).toBe("20 min");
    expect(formatDeliveryEstimate("1 hour")).toBe("1 hour");
    expect(formatDeliveryEstimate("1 sat")).toBe("1 sat");
  });
});

describe("minutesUntil", () => {
  it("counts down and floors at zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(minutesUntil("2026-06-15T12:10:00Z")).toBe(10);
    expect(minutesUntil("2026-06-15T11:00:00Z")).toBe(0);
  });

  it("returns null for missing or invalid input", () => {
    expect(minutesUntil(null)).toBeNull();
    expect(minutesUntil("garbage")).toBeNull();
  });
});

describe("formatTime / formatDate", () => {
  it("returns null for missing or invalid input", () => {
    expect(formatTime(null)).toBeNull();
    expect(formatTime("garbage")).toBeNull();
    expect(formatDate("garbage")).toBeNull();
  });
});

describe("formatOrderDate", () => {
  it("reads recent orders relatively", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 18, 0));

    const today = new Date(2026, 5, 15, 12, 30);
    const yesterday = new Date(2026, 5, 14, 12, 30);
    const older = new Date(2026, 5, 1, 12, 30);

    expect(formatOrderDate(today)).toBe(t("order:placedRelative.today", { time: formatTime(today) }));
    expect(formatOrderDate(yesterday)).toBe(
      t("order:placedRelative.yesterday", { time: formatTime(yesterday) }),
    );
    expect(formatOrderDate(older)).toBe(
      t("order:placedRelative.older", { date: formatDate(older), time: formatTime(older) }),
    );
  });

  it("is empty for missing or invalid input", () => {
    expect(formatOrderDate(null)).toBe("");
    expect(formatOrderDate("garbage")).toBe("");
  });
});

describe("formatRating", () => {
  it("renders one decimal and hides unrated", () => {
    expect(formatRating(4)).toBe("4.0");
    expect(formatRating(4.25)).toBe("4.3");
    expect(formatRating(0)).toBeNull();
    expect(formatRating(undefined)).toBeNull();
  });
});

describe("formatReviewCount", () => {
  it("abbreviates thousands", () => {
    expect(formatReviewCount(0)).toBe("0");
    expect(formatReviewCount(999)).toBe("999");
    expect(formatReviewCount(1500)).toBe("1.5k");
    expect(formatReviewCount(12000)).toBe("12k");
  });
});

describe("formatCount / formatPercent", () => {
  it("groups with the locale's separator", async () => {
    expect(formatCount(1204)).toBe("1,204");
    await changeLanguage("sr");
    expect(formatCount(1204)).toBe("1.204");
  });

  it("formats percentages", () => {
    expect(formatPercent(25)).toBe("25%");
    expect(formatPercent(12.345, { fractionDigits: 1 })).toBe("12.3%");
    expect(formatPercent(null)).toBe("-");
  });
});

describe("humanise / titleCase", () => {
  it("turns enums into text", () => {
    expect(humanise("in_transit")).toBe("In transit");
    expect(humanise(null)).toBe("");
  });

  it("title-cases category slugs", () => {
    expect(titleCase("main-courses")).toBe("Main Courses");
    expect(titleCase("hot_dogs  and_more")).toBe("Hot Dogs And More");
    expect(titleCase(undefined)).toBe("");
  });
});
