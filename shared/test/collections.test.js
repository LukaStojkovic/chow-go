import { describe, expect, it } from "vitest";
import { isCollectionLive, localizedText, normalizeCollectionInput, slugify } from "../src/collections.js";

const base = { kind: "dishes", title: { en: "Under 500 RSD", sr: "Ispod 500 dinara" } };

describe("collections", () => {
  it("slugifies titles, accents included", () => {
    expect(slugify("Najbolji ćevapi u gradu!")).toBe("najbolji-cevapi-u-gradu");
    expect(slugify("  --  ")).toBe("");
  });

  it("normalizes a valid collection with defaults", () => {
    const { collection } = normalizeCollectionInput({ ...base, rules: { maxPrice: "500", currency: "rsd", onlyDeals: "true" } });
    expect(collection).toMatchObject({
      kind: "dishes",
      slug: "under-500-rsd",
      maxItems: 12,
      manualOnly: false,
      pins: [],
      rules: { maxPrice: 500, currency: "RSD", onlyDeals: true, sort: "popular", cuisines: [], categories: [] },
    });
  });

  it("refuses bad input with a code and the field", () => {
    expect(normalizeCollectionInput({ ...base, kind: "people" }).error.code).toBe("COLLECTION_KIND");
    expect(normalizeCollectionInput({ ...base, title: { sr: "Samo srpski" } }).error.code).toBe("COLLECTION_TITLE");
    expect(normalizeCollectionInput({ ...base, slug: "Bad Slug" }).error.code).toBe("COLLECTION_SLUG");
    expect(normalizeCollectionInput({ ...base, rules: { sort: "alphabetical" } }).error).toMatchObject({ code: "COLLECTION_RULE", field: "rules.sort" });
    expect(normalizeCollectionInput({ ...base, rules: { categories: ["Spaceships"] } }).error.field).toBe("rules.categories");
    expect(normalizeCollectionInput({ ...base, kind: "restaurants", rules: { maxPrice: 500 } }).error.field).toBe("rules.maxPrice");
    expect(normalizeCollectionInput({ ...base, manualOnly: true }).error.code).toBe("COLLECTION_PINS");
    expect(normalizeCollectionInput({ ...base, pins: ["nope"] }).error.code).toBe("COLLECTION_PINS");
    expect(normalizeCollectionInput({ ...base, startsAt: "2026-10-10", endsAt: "2026-10-09" }).error.code).toBe("COLLECTION_DATES");
  });

  it("deduplicates pins and keeps their order", () => {
    const a = "a".repeat(24);
    const b = "b".repeat(24);
    expect(normalizeCollectionInput({ ...base, pins: [b, a, b] }).collection.pins).toEqual([b, a]);
  });

  it("is live only while published and within its dates", () => {
    const now = new Date("2026-10-13T12:00:00Z");
    expect(isCollectionLive({ status: "draft" }, now)).toBe(false);
    expect(isCollectionLive({ status: "published" }, now)).toBe(true);
    expect(isCollectionLive({ status: "published", startsAt: "2026-10-14" }, now)).toBe(false);
    expect(isCollectionLive({ status: "published", endsAt: "2026-10-13T12:00:00Z" }, now)).toBe(false);
  });

  it("picks the viewer's language and falls back to English", () => {
    expect(localizedText({ en: "Deals", sr: "Akcije" }, "sr")).toBe("Akcije");
    expect(localizedText({ en: "Deals" }, "sr")).toBe("Deals");
    expect(localizedText(null, "sr")).toBe("");
  });
});
