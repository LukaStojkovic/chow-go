import { describe, expect, it } from "vitest";
import { isInStock, soldOutOptionCount, soldOutState } from "../src/stock.js";

const now = new Date("2026-11-13T12:00:00Z");

describe("stock", () => {
  it("reads sold out with and without a restock time", () => {
    expect(soldOutState({ available: true }, now)).toBeNull();
    expect(soldOutState({ available: false }, now)).toEqual({ until: null });
    expect(soldOutState({ available: false, soldOutUntil: "2026-11-13T23:00:00Z" }, now)?.until).toEqual(new Date("2026-11-13T23:00:00Z"));
    expect(isInStock({ available: false, soldOutUntil: "2026-11-13T11:00:00Z" }, now)).toBe(true);
  });

  it("counts switched-off options", () => {
    const item = {
      optionGroups: [
        { options: [{ available: false }, { available: true }] },
        { options: [{ available: false, soldOutUntil: "2026-11-13T11:00:00Z" }, { available: false }] },
      ],
    };
    expect(soldOutOptionCount(item, now)).toBe(2);
    expect(soldOutOptionCount({}, now)).toBe(0);
  });
});
