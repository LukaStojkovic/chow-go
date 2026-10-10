import { describe, expect, it } from "vitest";
import { t } from "../src/i18n/index.js";
import { dayLabel, formatScheduledFor, groupSlotsByDay, slotsFor, takesPreorders } from "../src/deliveryTime.js";

const NOW = new Date("2026-10-07T06:00:00Z");
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const schedule = Object.fromEntries(
  DAYS.map((day) => [day, { isOpen: true, openingTime: "10:00", closingTime: "22:00" }]),
);
const restaurant = { isActive: true, isOpenNow: false, timezone: "Europe/Belgrade", schedule };

describe("takesPreorders", () => {
  it("admits a live, closed restaurant with slots", () => {
    expect(takesPreorders(restaurant, NOW)).toBe(true);
  });

  it("refuses an open, inactive, unapproved or slotless restaurant", () => {
    expect(takesPreorders({ ...restaurant, isOpenNow: true }, NOW)).toBe(false);
    expect(takesPreorders({ ...restaurant, isActive: false }, NOW)).toBe(false);
    expect(takesPreorders({ ...restaurant, approvalStatus: "pending" }, NOW)).toBe(false);
    expect(takesPreorders({ ...restaurant, schedule: undefined }, NOW)).toBe(false);
    expect(takesPreorders(null, NOW)).toBe(false);
  });
});

describe("slot days", () => {
  it("groups slots by day and labels the first two relatively", () => {
    const days = groupSlotsByDay(slotsFor(restaurant, NOW));
    expect(days.length).toBeGreaterThanOrEqual(3);
    expect(days.flatMap((day) => day.slots)).toHaveLength(slotsFor(restaurant, NOW).length);
    expect(dayLabel(days[0].date, NOW)).toBe(t("basket:schedule.today"));
    expect(dayLabel(days[1].date, NOW)).toBe(t("basket:schedule.tomorrow"));
    expect(dayLabel(days[2].date, NOW)).not.toBe(t("basket:schedule.tomorrow"));
  });
});

describe("formatScheduledFor", () => {
  it("names the day and the time, or nothing for a missing or bad value", () => {
    expect(formatScheduledFor(new Date("2026-10-07T17:30:00Z"), NOW)).toContain(t("basket:schedule.today"));
    expect(formatScheduledFor(null)).toBeNull();
    expect(formatScheduledFor("nope")).toBeNull();
  });
});
