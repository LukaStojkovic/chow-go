import { describe, expect, it } from "vitest";

import {
  DEFAULT_CLOSING_TIME,
  DEFAULT_OPENING_TIME,
  WEEK_DAYS,
  formatClock,
  formatDayHours,
  getTodayKey,
  isOvernight,
  normalizeSchedule,
  weekDays,
} from "../src/schedule.js";

describe("getTodayKey", () => {
  it("maps Date#getDay to the stored key", () => {
    expect(getTodayKey(new Date(2026, 9, 4))).toBe("sunday");
    expect(getTodayKey(new Date(2026, 9, 5))).toBe("monday");
    expect(getTodayKey(new Date(2026, 9, 10))).toBe("saturday");
  });
});

describe("weekDays", () => {
  it("lists Monday first with resolved labels", () => {
    const days = weekDays();
    expect(days.map((d) => d.key)).toEqual(WEEK_DAYS.map((d) => d.key));
    expect(days[0]).toMatchObject({ key: "monday", label: "Monday" });
  });
});

describe("normalizeSchedule", () => {
  it("fills every day with defaults", () => {
    const schedule = normalizeSchedule(undefined);
    expect(Object.keys(schedule)).toHaveLength(7);
    expect(schedule.sunday).toEqual({
      isOpen: true,
      openingTime: DEFAULT_OPENING_TIME,
      closingTime: DEFAULT_CLOSING_TIME,
    });
  });

  it("keeps an explicit closed day closed", () => {
    const schedule = normalizeSchedule({ monday: { isOpen: false }, tuesday: { openingTime: "07:30" } });
    expect(schedule.monday.isOpen).toBe(false);
    expect(schedule.tuesday).toEqual({ isOpen: true, openingTime: "07:30", closingTime: DEFAULT_CLOSING_TIME });
  });
});

describe("formatClock", () => {
  it("renders a stored HH:MM time", () => {
    expect(formatClock("21:05")).toMatch(/21:05|9:05/);
  });

  it("returns a placeholder for unusable input", () => {
    expect(formatClock(null)).toBe("--");
    expect(formatClock("2100")).toBe("--");
    expect(formatClock("ab:cd")).toBe("--");
  });
});

describe("formatDayHours", () => {
  it("describes closed, all-day and ranged days", () => {
    expect(formatDayHours(null)).toBe("Closed");
    expect(formatDayHours({ isOpen: false, openingTime: "09:00", closingTime: "17:00" })).toBe("Closed");
    expect(formatDayHours({ isOpen: true, openingTime: "00:00", closingTime: "00:00" })).toBe("Open 24 hours");
    expect(formatDayHours({ isOpen: true, openingTime: "09:00", closingTime: "17:00" })).toBe(
      `${formatClock("09:00")} - ${formatClock("17:00")}`,
    );
  });
});

describe("isOvernight", () => {
  it("is true only when closing comes before opening", () => {
    expect(isOvernight({ isOpen: true, openingTime: "18:00", closingTime: "02:00" })).toBe(true);
    expect(isOvernight({ isOpen: true, openingTime: "09:00", closingTime: "22:00" })).toBe(false);
    expect(isOvernight({ isOpen: true, openingTime: "10:00", closingTime: "10:00" })).toBe(false);
    expect(isOvernight({ isOpen: false, openingTime: "18:00", closingTime: "02:00" })).toBe(false);
    expect(isOvernight({ isOpen: true, openingTime: "18:00" })).toBe(false);
  });
});
