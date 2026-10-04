import { describe, expect, it } from "vitest";

import {
  categorySlug,
  filterMenuSections,
  toBasketLines,
  toDishView,
  toDishViews,
  toMenuSections,
} from "../src/adapters/menu.js";

describe("categorySlug", () => {
  it("turns free-text categories into stable anchors", () => {
    expect(categorySlug("Main Courses!")).toBe("main-courses");
    expect(categorySlug("main-courses")).toBe("main-courses");
    expect(categorySlug("  --Pizza--  ")).toBe("pizza");
    expect(categorySlug("")).toBe("other");
  });
});

describe("toDishView", () => {
  it("returns null without an id", () => {
    expect(toDishView(null)).toBeNull();
    expect(toDishView({ name: "x" })).toBeNull();
  });

  it("reads the server-resolved promotional price", () => {
    const view = toDishView({
      _id: "d1",
      name: "Burger",
      price: 10,
      promotionalPrice: 7.5,
      discountPercent: 25,
      promotion: { label: " Weekend deal " },
      category: "burgers",
      imageUrls: ["", "a.jpg"],
      restaurant: { _id: "r1", name: "Grill", currency: "eur" },
    });
    expect(view).toMatchObject({
      id: "d1",
      price: 7.5,
      basePrice: 10,
      discountPercent: 25,
      promoLabel: "Weekend deal",
      category: "burgers",
      categoryLabel: "Burgers",
      image: "a.jpg",
      images: ["a.jpg"],
      isAvailable: true,
      restaurantId: "r1",
      restaurantName: "Grill",
      currency: "EUR",
    });
  });

  it("shows no discount when the server sent none", () => {
    const view = toDishView({ _id: "d1", price: 10, restaurant: "r9", available: false });
    expect(view).toMatchObject({
      price: 10,
      basePrice: null,
      discountPercent: 0,
      promoLabel: null,
      isAvailable: false,
      restaurantId: "r9",
      currency: "RSD",
    });
  });

  it("drops invalid entries from a list", () => {
    expect(toDishViews([{ _id: "a" }, null, {}])).toHaveLength(1);
    expect(toDishViews("nope")).toEqual([]);
  });
});

describe("toMenuSections", () => {
  const raw = [
    { category: "drinks", items: [{ _id: "1", name: "Cola", available: false }] },
    { category: "empty", items: [] },
    { category: "main courses", items: [{ _id: "2", name: "Steak" }, { _id: "3", name: "Fish", available: false }] },
  ];

  it("drops empty sections and pushes sold-out ones to the end", () => {
    const sections = toMenuSections(raw);
    expect(sections.map((s) => s.id)).toEqual(["main-courses", "drinks"]);
    expect(sections[0]).toMatchObject({ label: "Main Courses", availableCount: 1 });
    expect(sections[1].availableCount).toBe(0);
  });

  it("returns [] for non-arrays", () => {
    expect(toMenuSections(null)).toEqual([]);
  });

  it("filters by name or description and recounts availability", () => {
    const sections = toMenuSections(raw);
    expect(filterMenuSections(sections, "  ")).toBe(sections);
    const filtered = filterMenuSections(sections, "FISH");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({ id: "main-courses", availableCount: 0 });
    expect(filtered[0].items.map((i) => i.id)).toEqual(["3"]);
  });
});

describe("toBasketLines", () => {
  it("normalises populated and bare menuItem references", () => {
    const lines = toBasketLines([
      { menuItem: { _id: "m1", name: "Pizza", imageUrls: ["p.jpg"] }, price: 8.5, quantity: 2 },
      { menuItem: "m2", name: "Cola", price: "1.99", quantity: "3", specialInstructions: "no ice" },
      { menuItem: null, price: 1, quantity: 1 },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ id: "m1", name: "Pizza", lineTotal: 17, image: "p.jpg", savings: 0 });
    expect(lines[1]).toMatchObject({ id: "m2", name: "Cola", lineTotal: 5.97, notes: "no ice" });
  });

  it("computes the saving on a line added at a promoted price", () => {
    const [line] = toBasketLines([{ menuItem: "m1", price: 7.5, basePrice: 10, quantity: 3 }]);
    expect(line).toMatchObject({ baseUnitPrice: 10, savings: 7.5, lineTotal: 22.5 });
  });

  it("ignores a basePrice that is not higher", () => {
    const [line] = toBasketLines([{ menuItem: "m1", price: 10, basePrice: 10, quantity: 1 }]);
    expect(line).toMatchObject({ baseUnitPrice: null, savings: 0 });
  });
});
