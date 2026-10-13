import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, isDateKey, weekStartKey, zonedDateKey } from "../src/dateKeys.js";
import { bucketKeys, parseReportRange, presetFor, presetRange, previousRange } from "../src/reportRange.js";
import { closureOn, deliverySlots, isOpenAt, normalizeClosures } from "../src/scheduling.js";

const TODAY = "2026-10-13";

describe("date keys", () => {
  it("does calendar arithmetic", () => {
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-10-01", "2026-10-13")).toBe(12);
    expect(weekStartKey("2026-10-18")).toBe("2026-10-12");
    expect(weekStartKey("2026-10-12")).toBe("2026-10-12");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
  });

  it("reads the local date in a zone", () => {
    expect(zonedDateKey(new Date("2026-10-12T22:30:00Z"), "Europe/Belgrade")).toBe("2026-10-13");
    expect(zonedDateKey(new Date("2026-10-12T22:30:00Z"), "UTC")).toBe("2026-10-12");
  });
});

describe("report ranges", () => {
  it("defaults to the last 30 days and clamps the future", () => {
    expect(parseReportRange({}, TODAY).range).toEqual({ from: "2026-09-14", to: TODAY, days: 30, granularity: "day" });
    expect(parseReportRange({ from: "2026-10-01", to: "2026-12-01" }, TODAY).range.to).toBe(TODAY);
  });

  it("refuses bad and over-long ranges", () => {
    expect(parseReportRange({ from: "2026-10-10", to: "2026-10-01" }, TODAY).error.code).toBe("REPORT_RANGE_INVALID");
    expect(parseReportRange({ from: "nope" }, TODAY).error.code).toBe("REPORT_RANGE_INVALID");
    expect(parseReportRange({ from: "2025-01-01", to: TODAY }, TODAY).error.code).toBe("REPORT_RANGE_TOO_LONG");
  });

  it("names presets and picks a bucket size", () => {
    expect(presetRange("lastMonth", TODAY)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(presetFor(presetRange("last7", TODAY), TODAY)).toBe("last7");
    expect(presetFor({ from: "2026-10-02", to: "2026-10-05" }, TODAY)).toBe("custom");
    expect(parseReportRange({ preset: "last90" }, TODAY).range.granularity).toBe("week");
    expect(parseReportRange({ preset: "thisYear" }, TODAY).range.granularity).toBe("month");
  });

  it("lists buckets and the previous period", () => {
    expect(bucketKeys({ from: "2026-10-01", to: "2026-10-03", granularity: "day" })).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(bucketKeys({ from: "2026-10-01", to: "2026-10-13", granularity: "week" })).toEqual(["2026-09-28", "2026-10-05", "2026-10-12"]);
    expect(bucketKeys({ from: "2026-08-15", to: "2026-10-13", granularity: "month" })).toEqual(["2026-08-01", "2026-09-01", "2026-10-01"]);
    expect(previousRange({ from: "2026-10-08", to: "2026-10-14", days: 7 })).toMatchObject({ from: "2026-10-01", to: "2026-10-07" });
  });
});

describe("closures", () => {
  const allDay = Object.fromEntries(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => [d, { isOpen: true, openingTime: "18:00", closingTime: "02:00" }]),
  );
  const closures = [{ from: "2026-10-13", to: "2026-10-14", reason: "" }];

  it("shuts whole local days and the overnight spill out of them", () => {
    expect(closureOn(closures, "2026-10-14")).toBeTruthy();
    expect(closureOn(closures, "2026-10-15")).toBeNull();
    expect(isOpenAt(allDay, new Date("2026-10-13T18:00:00Z"), "Europe/Belgrade")).toBe(true);
    expect(isOpenAt(allDay, new Date("2026-10-13T18:00:00Z"), "Europe/Belgrade", closures)).toBe(false);
    expect(isOpenAt(allDay, new Date("2026-10-14T23:30:00Z"), "Europe/Belgrade", closures)).toBe(false);
    expect(isOpenAt(allDay, new Date("2026-10-15T17:00:00Z"), "Europe/Belgrade", closures)).toBe(true);
  });

  it("keeps pre-order slots out of a closure", () => {
    const now = new Date("2026-10-13T10:00:00Z");
    const slots = deliverySlots({ schedule: allDay, timeZone: "Europe/Belgrade", closures }, now);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s >= new Date("2026-10-15T16:00:00Z"))).toBe(true);
  });

  it("validates input", () => {
    expect(normalizeClosures([{ from: "2026-10-20" }], TODAY).closures).toEqual([{ from: "2026-10-20", to: "2026-10-20", reason: "" }]);
    expect(normalizeClosures([{ from: "2026-10-01", to: "2026-10-02" }], TODAY).closures).toEqual([]);
    expect(normalizeClosures([{ from: "2026-10-20", to: "2026-10-19" }], TODAY).error.code).toBe("CLOSURE_INVALID");
    expect(normalizeClosures([{ from: "2026-10-20", to: "2027-01-20" }], TODAY).error.code).toBe("CLOSURE_TOO_LONG");
    expect(normalizeClosures([{ from: "2028-10-20" }], TODAY).error.code).toBe("CLOSURE_TOO_FAR");
    expect(normalizeClosures([{ from: "2026-10-20", reason: "x".repeat(81) }], TODAY).error.code).toBe("CLOSURE_REASON");
    expect(normalizeClosures("not json", TODAY).error.code).toBe("CLOSURE_INVALID");
  });
});
