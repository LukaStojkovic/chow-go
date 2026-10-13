import { describe, expect, it } from "vitest";
import {
  foldText,
  highlightMatch,
  matchRank,
  matchingCategories,
  matchingCuisines,
  normalizeSearchTerm,
  searchPattern,
} from "../src/search.js";
import { parseSearchFilters, toSearchParams } from "../src/searchFilters.js";

describe("search matching", () => {
  it("folds accents and case without changing length", () => {
    expect(foldText("Ćevapčići ĐAK")).toBe("cevapcici dak");
    expect(foldText("Žika").length).toBe(4);
  });

  it("builds a pattern that ignores accents on either side and escapes regex syntax", () => {
    expect(new RegExp(searchPattern("cevap"), "i").test("ĆEVAPI")).toBe(true);
    expect(new RegExp(searchPattern("ćevap"), "i").test("cevapi")).toBe(true);
    expect(new RegExp(searchPattern("(a+)+$"), "i").test("aaaa")).toBe(false);
    expect(new RegExp(searchPattern("a.b"), "i").test("axb")).toBe(false);
  });

  it("ranks a prefix over a word start over a substring", () => {
    expect(matchRank("Pizza Bar", "piz")).toBe(3);
    expect(matchRank("Pizza Bar", "bar")).toBe(2);
    expect(matchRank("Pizzabar", "bar")).toBe(1);
    expect(matchRank("Pizza", "sushi")).toBe(0);
    expect(matchRank("Pizza", "  ")).toBe(0);
  });

  it("highlights the original characters", () => {
    expect(highlightMatch("Ćevapi kod Žike", "zik")).toEqual({ before: "Ćevapi kod ", match: "Žik", after: "e" });
    expect(highlightMatch("Pizza", "sushi")).toBeNull();
  });

  it("finds cuisines and categories by their label in any language", () => {
    expect(matchingCuisines("ital")).toEqual(["italian"]);
    expect(matchingCuisines("domać")).toContain("serbian");
    expect(matchingCategories("dezert")).toEqual(["Desserts"]);
  });

  it("normalizes whitespace and length", () => {
    expect(normalizeSearchTerm("  two   words ")).toBe("two words");
    expect(normalizeSearchTerm("x".repeat(200))).toHaveLength(80);
  });
});

describe("search filter params", () => {
  it("round-trips through query params and leaves defaults out", () => {
    const filters = { openNow: true, maxDeliveryTime: "30", sort: "rating" };
    expect(toSearchParams(filters)).toEqual({ openNow: "true", maxDeliveryTime: "30", sort: "rating" });
    expect(parseSearchFilters(toSearchParams(filters))).toEqual(filters);
    expect(toSearchParams({ openNow: false, maxDeliveryTime: "any", sort: "relevance" })).toEqual({});
  });

  it("ignores unknown values", () => {
    expect(parseSearchFilters({ sort: "cheapest", maxDeliveryTime: "-5", openNow: "yes" })).toEqual({
      openNow: false,
      maxDeliveryTime: "any",
      sort: "relevance",
    });
  });
});
