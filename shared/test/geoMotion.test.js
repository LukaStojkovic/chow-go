import { describe, expect, it } from "vitest";

import { bearingDegrees, glideDurationMs, nextHeading, shortestRotation } from "../src/geo.js";

describe("courier marker motion", () => {
  it("reads compass bearings", () => {
    expect(Math.round(bearingDegrees([44.8, 20.45], [44.81, 20.45]))).toBe(0);
    expect(Math.round(bearingDegrees([44.8, 20.45], [44.8, 20.46]))).toBe(90);
    expect(Math.round(bearingDegrees([44.8, 20.45], [44.79, 20.45]))).toBe(180);
    expect(Math.round(bearingDegrees([44.8, 20.45], [44.8, 20.44]))).toBe(270);
  });

  it("glides for about the gap between fixes, within limits", () => {
    expect(glideDurationMs(3000)).toBe(3000);
    expect(glideDurationMs(100)).toBe(600);
    expect(glideDurationMs(60000)).toBe(4000);
    expect(glideDurationMs(undefined)).toBe(1000);
  });

  it("turns on a real move and ignores jitter", () => {
    expect(Math.round(nextHeading([44.8, 20.45], [44.801, 20.45], 45))).toBe(0);
    expect(nextHeading([44.8, 20.45], [44.80001, 20.45], 45)).toBe(45);
    expect(nextHeading(null, [44.8, 20.45], 45)).toBe(45);
  });

  it("rotates the short way round", () => {
    expect(shortestRotation(350, 10)).toBe(370);
    expect(shortestRotation(10, 350)).toBe(-10);
    expect(shortestRotation(370, 20)).toBe(380);
    expect(shortestRotation(null, 90)).toBe(90);
  });
});
