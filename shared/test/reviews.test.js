import { describe, expect, it } from "vitest";

import { normalizeReviewTags, reviewerDisplayName, tagsForRating } from "../src/reviews.js";

describe("review tags", () => {
  it("offers praise for good ratings and problems for poor ones", () => {
    expect(tagsForRating("restaurant", 5)).toContain("tasty");
    expect(tagsForRating("restaurant", 2)).toContain("arrived_cold");
    expect(tagsForRating("courier", 4)).toContain("fast");
    expect(tagsForRating("restaurant", 0)).toEqual([]);
    expect(tagsForRating("dish", 5)).toEqual([]);
  });

  it("keeps only tags that fit the rating, once, in catalog order", () => {
    expect(normalizeReviewTags("restaurant", 5, ["well_packed", "tasty", "tasty", "arrived_cold", "made_up"])).toEqual([
      "tasty",
      "well_packed",
    ]);
    expect(normalizeReviewTags("restaurant", 1, ["tasty"])).toEqual([]);
    expect(normalizeReviewTags("courier", 2, "late")).toEqual([]);
  });

  it("shows a reviewer by first name and initial", () => {
    expect(reviewerDisplayName("Marko Petrović")).toBe("Marko P.");
    expect(reviewerDisplayName("Ana Maria  ivić")).toBe("Ana I.");
    expect(reviewerDisplayName("Cher")).toBe("Cher");
    expect(reviewerDisplayName("  ")).toBeNull();
  });
});
