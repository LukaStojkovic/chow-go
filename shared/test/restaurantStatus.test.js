import { describe, expect, it } from "vitest";
import { addMinutesToEstimate, busyExtraMinutes, isAcceptingAt, pauseState } from "../src/restaurantStatus.js";
import { deliverySlots } from "../src/scheduling.js";

const now = new Date("2026-10-20T10:00:00Z");
const allDay = Object.fromEntries(
  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => [d, { isOpen: true, openingTime: "00:00", closingTime: "00:00" }]),
);

describe("restaurant status", () => {
  it("reads a pause until it expires", () => {
    const paused = { schedule: allDay, pause: { until: "2026-10-20T10:30:00Z", reason: "Oven" } };
    expect(pauseState(paused, now)).toMatchObject({ indefinite: false, reason: "Oven" });
    expect(isAcceptingAt(paused, now)).toBe(false);
    expect(isAcceptingAt(paused, new Date("2026-10-20T10:31:00Z"))).toBe(true);
    expect(pauseState({ pause: { indefinite: true } }, now)).toMatchObject({ until: null, indefinite: true });
    expect(pauseState({ pause: { until: null, indefinite: false } }, now)).toBeNull();
  });

  it("adds busy minutes only while busy", () => {
    const busy = { busy: { extraMinutes: 15, until: "2026-10-20T11:00:00Z" } };
    expect(busyExtraMinutes(busy, now)).toBe(15);
    expect(busyExtraMinutes(busy, new Date("2026-10-20T11:00:00Z"))).toBe(0);
    expect(addMinutesToEstimate("30-45 min", 15)).toBe("45-60 min");
    expect(addMinutesToEstimate("soon", 15)).toBe("soon");
  });

  it("keeps pre-order slots out of a pause", () => {
    const until = "2026-10-20T14:00:00Z";
    const slots = deliverySlots({ schedule: allDay, timeZone: "Europe/Belgrade", pause: { until } }, now);
    expect(slots[0].getTime() - 60 * 60 * 1000).toBeGreaterThanOrEqual(new Date(until).getTime());
    expect(deliverySlots({ schedule: allDay, timeZone: "Europe/Belgrade", pause: { indefinite: true } }, now)).toEqual([]);
  });
});

describe("order ahead on cards", async () => {
  const { toRestaurantView } = await import("../src/adapters/restaurant.js");
  const base = { _id: "r1", name: "R", isActive: true, timezone: "Europe/Belgrade" };
  const evenings = Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => [d, { isOpen: true, openingTime: "18:00", closingTime: "22:00" }]),
  );

  it("flags a closed restaurant that still has delivery slots", () => {
    const view = toRestaurantView({ ...base, isOpenNow: false, schedule: evenings });
    expect(view.availability).toBe("closed");
    expect(view.orderAhead?.firstSlot).toBeTruthy();
  });

  it("not when it is open, paused indefinitely or unapproved", () => {
    expect(toRestaurantView({ ...base, isOpenNow: true, schedule: evenings }).orderAhead).toBeNull();
    expect(toRestaurantView({ ...base, isOpenNow: false, schedule: evenings, pause: { indefinite: true } }).orderAhead).toBeNull();
    expect(toRestaurantView({ ...base, isOpenNow: false, schedule: evenings, approvalStatus: "pending" }).orderAhead).toBeNull();
  });
});
