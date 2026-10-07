import { describe, expect, it } from "vitest";

import {
  OPTION_LIMITS,
  basketLineId,
  hasRequiredOptions,
  normalizeOptionGroups,
  optionsSummary,
  resolveOptionSelection,
} from "../src/menuOptions.js";

const size = {
  _id: "g1",
  name: "Size",
  minSelect: 1,
  maxSelect: 1,
  options: [
    { _id: "o1", name: "Regular", priceDelta: 0, available: true },
    { _id: "o2", name: "Large", priceDelta: 1.5, available: true },
  ],
};
const extras = {
  _id: "g2",
  name: "Extras",
  minSelect: 0,
  maxSelect: 2,
  options: [
    { _id: "o3", name: "Cheese", priceDelta: 0.7, available: true },
    { _id: "o4", name: "Bacon", priceDelta: 1.1, available: true },
    { _id: "o5", name: "Truffle", priceDelta: 3, available: false },
  ],
};

describe("normalizeOptionGroups", () => {
  it("treats nothing as no groups", () => {
    expect(normalizeOptionGroups(undefined)).toEqual({ groups: [] });
    expect(normalizeOptionGroups("")).toEqual({ groups: [] });
  });

  it("parses the JSON a multipart form sends and coerces its strings", () => {
    const input = JSON.stringify([
      {
        name: " Size ",
        minSelect: "1",
        maxSelect: "1",
        options: [{ name: "Large", priceDelta: "1.505", available: "false" }],
      },
    ]);
    expect(normalizeOptionGroups(input)).toEqual({
      groups: [
        {
          name: "Size",
          minSelect: 1,
          maxSelect: 1,
          options: [{ name: "Large", priceDelta: 1.51, available: false }],
        },
      ],
    });
  });

  it("keeps existing ids so baskets still match after an edit", () => {
    const { groups } = normalizeOptionGroups([size]);
    expect(groups[0]._id).toBe("g1");
    expect(groups[0].options.map((o) => o._id)).toEqual(["o1", "o2"]);
  });

  it("refuses bad input with a code and the group's position", () => {
    expect(normalizeOptionGroups("{not json").error.code).toBe("OPTION_GROUPS_INVALID");
    expect(normalizeOptionGroups([{ name: "", options: [{ name: "a" }] }]).error).toEqual({
      code: "OPTION_GROUP_NAME",
      group: 0,
    });
    expect(normalizeOptionGroups([{ name: "Size", options: [] }]).error.code).toBe("OPTION_GROUP_EMPTY");
    expect(normalizeOptionGroups([{ name: "Size", options: [{ name: "a", priceDelta: -1 }] }]).error.code).toBe(
      "OPTION_PRICE",
    );
    expect(
      normalizeOptionGroups([{ name: "Size", minSelect: 2, maxSelect: 1, options: [{ name: "a" }, { name: "b" }] }])
        .error.code,
    ).toBe("OPTION_GROUP_RANGE");
    expect(
      normalizeOptionGroups([{ name: "Size", minSelect: 0, maxSelect: 3, options: [{ name: "a" }] }]).error.code,
    ).toBe("OPTION_GROUP_RANGE");
    const many = Array.from({ length: OPTION_LIMITS.groups + 1 }, () => ({ name: "g", options: [{ name: "a" }] }));
    expect(normalizeOptionGroups(many).error.code).toBe("OPTION_TOO_MANY_GROUPS");
  });
});

describe("resolveOptionSelection", () => {
  it("prices a complete selection in menu order", () => {
    const result = resolveOptionSelection([size, extras], ["o4", "o2", "o3"]);
    expect(result.ok).toBe(true);
    expect(result.selections.map((s) => s.name)).toEqual(["Large", "Cheese", "Bacon"]);
    expect(result.priceDelta).toBe(3.3);
  });

  it("allows an empty pick when nothing is required", () => {
    expect(resolveOptionSelection([extras], [])).toMatchObject({ ok: true, priceDelta: 0, selections: [] });
    expect(resolveOptionSelection([], undefined)).toMatchObject({ ok: true, priceDelta: 0 });
  });

  it("names the group that still needs a pick", () => {
    expect(resolveOptionSelection([size, extras], ["o3"])).toMatchObject({
      ok: false,
      code: "OPTION_REQUIRED",
      group: "Size",
    });
  });

  it("refuses too many, sold-out and unknown options", () => {
    expect(resolveOptionSelection([size], ["o1", "o2"])).toMatchObject({ code: "OPTION_TOO_MANY", max: 1 });
    expect(resolveOptionSelection([size, extras], ["o1", "o5"])).toMatchObject({
      code: "OPTION_UNAVAILABLE",
      option: "Truffle",
    });
    expect(resolveOptionSelection([size], ["o1", "zzz"])).toMatchObject({ code: "OPTION_UNKNOWN" });
  });
});

describe("basket line helpers", () => {
  it("keeps a plain dish's line id equal to the dish id", () => {
    expect(basketLineId("m1")).toBe("m1");
    expect(basketLineId("m1", [])).toBe("m1");
  });

  it("gives the same id to the same picks in any order", () => {
    expect(basketLineId("m1", ["o3", "o2"])).toBe("m1~o2-o3");
    expect(basketLineId("m1", ["o2", "o3", "o2"])).toBe(basketLineId("m1", ["o3", "o2"]));
  });

  it("summarises and flags required groups", () => {
    expect(optionsSummary([{ name: "Large" }, { name: "Cheese" }])).toBe("Large, Cheese");
    expect(optionsSummary(undefined)).toBe("");
    expect(hasRequiredOptions([size])).toBe(true);
    expect(hasRequiredOptions([extras])).toBe(false);
    expect(hasRequiredOptions(undefined)).toBe(false);
  });
});
