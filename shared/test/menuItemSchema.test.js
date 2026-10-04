import { describe, expect, it } from "vitest";

import {
  EMPTY_PROMOTION,
  editMenuItemSchema,
  menuItemSchema,
  promotionToFormValues,
} from "../src/menuItemSchema.js";

const image = { uri: "file:///a.jpg", name: "a.jpg", type: "image/jpeg" };

const dish = (extra) => ({
  name: "Burger",
  category: "Burgers",
  price: "10",
  available: true,
  description: "Beef, cheese",
  images: [image],
  ...extra,
});

const promo = (extra) => ({ ...EMPTY_PROMOTION, isActive: true, value: "20", ...extra });

const issues = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const out = {};
  for (const i of result.error.issues) out[i.path.join(".")] ??= i.message;
  return out;
};

describe("menuItemSchema", () => {
  it("accepts a dish and defaults the promotion", () => {
    const result = menuItemSchema.safeParse(dish());
    expect(result.success).toBe(true);
    expect(result.data.promotion).toEqual(EMPTY_PROMOTION);
  });

  it("requires a positive price", () => {
    expect(issues(menuItemSchema, dish({ price: "" }))).toHaveProperty("price", "validation:menuItem.priceRequired");
    expect(issues(menuItemSchema, dish({ price: "0" }))).toHaveProperty("price", "validation:menuItem.pricePositive");
    expect(issues(menuItemSchema, dish({ price: "abc" }))).toHaveProperty("price", "validation:menuItem.pricePositive");
  });

  it("requires a non-blank description", () => {
    expect(issues(menuItemSchema, dish({ description: "   " }))).toHaveProperty(
      "description",
      "validation:menuItem.descriptionRequired",
    );
  });

  it("requires 1-6 uploadable images", () => {
    expect(issues(menuItemSchema, dish({ images: [] }))).toHaveProperty("images", "validation:menuItem.imagesRequired");
    expect(issues(menuItemSchema, dish({ images: Array(7).fill(image) }))).toHaveProperty(
      "images",
      'validation:menuItem.imagesMax::{"count":6}',
    );
    expect(issues(menuItemSchema, dish({ images: ["not-a-file"] }))).toHaveProperty(
      "images.0",
      "validation:menuItem.imageUnsupported",
    );
  });

  it("ignores an inactive promotion entirely", () => {
    expect(menuItemSchema.safeParse(dish({ promotion: { ...EMPTY_PROMOTION, value: "999" } })).success).toBe(true);
  });

  it("checks an active promotion against the dish price", () => {
    expect(menuItemSchema.safeParse(dish({ promotion: promo() })).success).toBe(true);
    expect(issues(menuItemSchema, dish({ promotion: promo({ value: "" }) }))).toEqual({
      "promotion.value": "validation:promotion.valueRequired",
    });
    expect(issues(menuItemSchema, dish({ promotion: promo({ value: "91" }) }))).toEqual({
      "promotion.value": 'validation:promotion.maxPercent::{"max":90}',
    });
    expect(issues(menuItemSchema, dish({ promotion: promo({ type: "fixed", value: "9.6" }) }))).toEqual({
      "promotion.value": 'validation:promotion.belowFloor::{"min":"0.50"}',
    });
  });

  it("refuses a window that ends before it starts", () => {
    const window = promo({ startsAt: "2026-07-02T10:00", endsAt: "2026-07-01T10:00" });
    expect(issues(menuItemSchema, dish({ promotion: window }))).toEqual({
      "promotion.endsAt": "validation:promotion.endsBeforeStart",
    });
  });

  it("caps the label length", () => {
    expect(issues(menuItemSchema, dish({ promotion: promo({ label: "x".repeat(41) }) }))).toEqual({
      "promotion.label": 'validation:promotion.labelMax::{"max":40}',
    });
  });
});

describe("editMenuItemSchema", () => {
  it("accepts kept images in place of new uploads", () => {
    expect(editMenuItemSchema.safeParse(dish({ images: [], existingImages: ["https://x/a.jpg"] })).success).toBe(true);
  });

  it("requires at least one image, new or kept", () => {
    expect(issues(editMenuItemSchema, dish({ images: [] }))).toEqual({ images: "validation:menuItem.imagesRequired" });
  });

  it("runs the same promotion checks", () => {
    expect(issues(editMenuItemSchema, dish({ promotion: promo({ value: "95" }) }))).toHaveProperty("promotion.value");
  });
});

describe("promotionToFormValues", () => {
  it("returns a fresh empty promotion for none", () => {
    const values = promotionToFormValues(null);
    expect(values).toEqual(EMPTY_PROMOTION);
    expect(values).not.toBe(EMPTY_PROMOTION);
  });

  it("converts a stored promotion back into form strings", () => {
    const start = new Date(2026, 6, 1, 18, 30);
    expect(
      promotionToFormValues({ isActive: true, type: "fixed", value: 3, label: "Deal", startsAt: start.toISOString() }),
    ).toEqual({
      isActive: true,
      type: "fixed",
      value: "3",
      label: "Deal",
      startsAt: "2026-07-01T18:30",
      endsAt: "",
    });
  });

  it("normalises unknown types and invalid dates", () => {
    expect(promotionToFormValues({ type: "weird", value: 0, startsAt: "garbage" })).toMatchObject({
      isActive: false,
      type: "percentage",
      value: "",
      startsAt: "",
    });
  });
});
