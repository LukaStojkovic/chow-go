import { describe, expect, it } from "vitest";

import { fromCents, isWholeCents, lineTotal, sumMoney, toCents, toMoney } from "../src/money.js";

describe("toCents", () => {
  it("rounds half-cents away from zero, including the classic 1.005 case", () => {
    expect(toCents(1.005)).toBe(101);
    expect(toCents(-1.005)).toBe(-101);
    expect(toCents(2.675)).toBe(268);
  });

  it("accepts numeric strings", () => {
    expect(toCents("2.5")).toBe(250);
  });

  it("treats non-finite input as zero", () => {
    expect(toCents(NaN)).toBe(0);
    expect(toCents("abc")).toBe(0);
    expect(toCents(Infinity)).toBe(0);
    expect(toCents(undefined)).toBe(0);
  });
});

describe("fromCents / toMoney", () => {
  it("converts back to a decimal amount", () => {
    expect(fromCents(1999)).toBe(19.99);
    expect(toMoney(1.005)).toBe(1.01);
    expect(toMoney(19.999)).toBe(20);
  });
});

describe("sumMoney", () => {
  it("adds without float drift", () => {
    expect(sumMoney(0.1, 0.2)).toBe(0.3);
    expect(sumMoney(10.1, 14.2)).toBe(24.3);
  });

  it("handles negatives and no arguments", () => {
    expect(sumMoney(10, -2.55)).toBe(7.45);
    expect(sumMoney()).toBe(0);
  });
});

describe("lineTotal", () => {
  it("multiplies a price by a whole quantity", () => {
    expect(lineTotal(19.99, 3)).toBe(59.97);
    expect(lineTotal(0.1, 3)).toBe(0.3);
  });

  it("treats an unusable quantity as zero", () => {
    expect(lineTotal(5, "x")).toBe(0);
    expect(lineTotal(5, undefined)).toBe(0);
  });
});

describe("isWholeCents", () => {
  it("accepts amounts with at most two decimals", () => {
    expect(isWholeCents(1.5)).toBe(true);
    expect(isWholeCents(250)).toBe(true);
  });

  it("rejects sub-cent amounts and non-numbers", () => {
    expect(isWholeCents(1.005)).toBe(false);
    expect(isWholeCents(NaN)).toBe(false);
    expect(isWholeCents("abc")).toBe(false);
  });
});
