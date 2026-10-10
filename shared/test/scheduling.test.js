import { describe, expect, it } from "vitest";

import {
  SCHEDULING,
  deliverySlots,
  isOpenAt,
  kitchenLeadMinutes,
  releaseTimeFor,
  schedulingInputs,
  slotProblem,
} from "../src/scheduling.js";

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const weekly = (entry) => Object.fromEntries(days.map((day) => [day, entry]));
const tenToTen = { schedule: weekly({ isOpen: true, openingTime: "10:00", closingTime: "22:00" }), timeZone: "Europe/Belgrade" };

// Thursday 12:00 in Belgrade (UTC+2 in October).
const now = new Date("2026-10-08T10:00:00Z");
const local = (iso) => new Date(iso);

describe("isOpenAt", () => {
  it("reads the restaurant's own zone and overnight windows", () => {
    expect(isOpenAt(tenToTen.schedule, now, "Europe/Belgrade")).toBe(true);
    expect(isOpenAt(tenToTen.schedule, local("2026-10-08T20:30:00Z"), "Europe/Belgrade")).toBe(false);
    const lateNight = weekly({ isOpen: true, openingTime: "18:00", closingTime: "02:00" });
    expect(isOpenAt(lateNight, local("2026-10-08T23:30:00Z"), "Europe/Belgrade")).toBe(true);
    expect(isOpenAt(null, now)).toBe(false);
  });
});

describe("slotProblem", () => {
  it("accepts a slot whose kitchen start falls inside opening hours", () => {
    expect(slotProblem(tenToTen, local("2026-10-08T12:00:00Z"), now)).toBeNull();
  });

  it("lets a delivery land after closing when the kitchen starts before it", () => {
    // 22:30 local delivery, kitchen starts 21:30 local.
    expect(slotProblem(tenToTen, local("2026-10-08T20:30:00Z"), now)).toBeNull();
  });

  it("refuses a slot whose kitchen start is outside opening hours", () => {
    // 23:15 local delivery needs the kitchen at 22:15.
    expect(slotProblem(tenToTen, local("2026-10-08T21:15:00Z"), now)).toBe("SCHEDULE_CLOSED");
    // 10:30 local tomorrow needs the kitchen at 09:30.
    expect(slotProblem(tenToTen, local("2026-10-09T08:30:00Z"), now)).toBe("SCHEDULE_CLOSED");
  });

  it("refuses slots that are too soon, too far, off the grid or not dates", () => {
    expect(slotProblem(tenToTen, local("2026-10-08T10:30:00Z"), now)).toBe("SCHEDULE_TOO_SOON");
    expect(slotProblem(tenToTen, local("2026-10-12T12:00:00Z"), now)).toBe("SCHEDULE_TOO_FAR");
    expect(slotProblem(tenToTen, local("2026-10-08T12:07:00Z"), now)).toBe("SCHEDULE_INVALID");
    expect(slotProblem(tenToTen, "nope", now)).toBe("SCHEDULE_INVALID");
  });
});

describe("deliverySlots", () => {
  it("lists valid quarter-hour slots from the minimum lead time, earliest first", () => {
    const slots = deliverySlots(tenToTen, now);
    expect(slots[0].toISOString()).toBe("2026-10-08T10:45:00.000Z");
    expect(slots.every((slot) => slotProblem(tenToTen, slot, now) === null)).toBe(true);
    expect(slots.every((slot, i) => i === 0 || slot > slots[i - 1])).toBe(true);
    expect(slots.some((slot) => slot.toISOString() === "2026-10-08T20:30:00.000Z")).toBe(true);
    expect(slots.some((slot) => slot.toISOString() === "2026-10-08T21:15:00.000Z")).toBe(false);
  });

  it("is empty for a restaurant closed all week", () => {
    expect(deliverySlots({ schedule: weekly({ isOpen: false }) }, now)).toEqual([]);
  });

  it("never reaches past the scheduling horizon", () => {
    const last = deliverySlots(tenToTen, now).at(-1);
    expect(last.getTime() - now.getTime()).toBeLessThanOrEqual(SCHEDULING.maxDaysAhead * 24 * 3600 * 1000);
  });
});

describe("release time", () => {
  it("is the delivery time minus prep and travel", () => {
    expect(kitchenLeadMinutes()).toBe(60);
    expect(kitchenLeadMinutes(45)).toBe(75);
    expect(releaseTimeFor("2026-10-08T18:00:00Z", 20).toISOString()).toBe("2026-10-08T17:10:00.000Z");
  });

  it("reads a restaurant document", () => {
    expect(schedulingInputs({ schedule: tenToTen.schedule, timezone: "Europe/London" })).toEqual({
      schedule: tenToTen.schedule,
      timeZone: "Europe/London",
      prepMinutes: undefined,
    });
    expect(schedulingInputs({}).timeZone).toBe("Europe/Belgrade");
  });
});
