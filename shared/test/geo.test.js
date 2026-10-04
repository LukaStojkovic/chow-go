import { describe, expect, it } from "vitest";

import {
  formatDistance,
  formatDuration,
  haversineMeters,
  isSamePosition,
  lerpLatLng,
  toLatLng,
  toOsrmCoord,
} from "../src/geo.js";

describe("toLatLng", () => {
  it("flips GeoJSON [lng, lat] into [lat, lng]", () => {
    expect(toLatLng([20.46, 44.81])).toEqual([44.81, 20.46]);
  });

  it("rejects malformed, null-island and out-of-range coordinates", () => {
    expect(toLatLng("x")).toBeNull();
    expect(toLatLng([1, 2, 3])).toBeNull();
    expect(toLatLng([NaN, 1])).toBeNull();
    expect(toLatLng([0, 0])).toBeNull();
    expect(toLatLng([200, 10])).toBeNull();
    expect(toLatLng([10, 91])).toBeNull();
  });
});

describe("toOsrmCoord", () => {
  it("writes lng,lat", () => {
    expect(toOsrmCoord([44.8, 20.4])).toBe("20.4,44.8");
    expect(toOsrmCoord(null)).toBeNull();
  });
});

describe("haversineMeters", () => {
  it("measures one degree of latitude", () => {
    expect(haversineMeters([0, 0], [1, 0])).toBeCloseTo(111195, 0);
  });

  it("is zero for the same point and Infinity for a missing one", () => {
    expect(haversineMeters([44.8, 20.4], [44.8, 20.4])).toBe(0);
    expect(haversineMeters(null, [1, 1])).toBe(Infinity);
  });
});

describe("lerpLatLng", () => {
  it("interpolates linearly", () => {
    expect(lerpLatLng([0, 0], [10, 20], 0.5)).toEqual([5, 10]);
    expect(lerpLatLng([0, 0], [10, 20], 0)).toEqual([0, 0]);
  });
});

describe("isSamePosition", () => {
  it("treats points under a metre apart as the same", () => {
    expect(isSamePosition([44.8, 20.4], [44.800004, 20.4])).toBe(true);
    expect(isSamePosition([44.8, 20.4], [44.8001, 20.4])).toBe(false);
  });

  it("compares missing positions by identity", () => {
    expect(isSamePosition(null, null)).toBe(true);
    expect(isSamePosition([1, 1], null)).toBe(false);
  });
});

describe("formatDistance (route)", () => {
  it("shows metres as measured, not bucketed", () => {
    expect(formatDistance(74)).toBe("74 m");
    expect(formatDistance(1500)).toBe("1.5 km");
    expect(formatDistance(null)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("rounds to at least one minute", () => {
    expect(formatDuration(0)).toBe("1 min");
    expect(formatDuration(600)).toBe("10 min");
  });

  it("switches to hours past 60 minutes", () => {
    expect(formatDuration(3900)).toBe("1h 5m");
    expect(formatDuration(null)).toBeNull();
  });
});
