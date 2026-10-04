import { afterEach, describe, expect, it, vi } from "vitest";

import { toRestaurantView, toRestaurantViews, unavailableReason } from "../src/adapters/restaurant.js";

afterEach(() => {
  vi.useRealTimers();
});

const MONDAY_NOON = new Date(2026, 9, 5, 12, 0);

describe("toRestaurantView", () => {
  it("returns null without an id", () => {
    expect(toRestaurantView(null)).toBeNull();
    expect(toRestaurantView({ name: "x" })).toBeNull();
    expect(toRestaurantViews("nope")).toEqual([]);
    expect(toRestaurantViews([{ _id: "a" }, null])).toHaveLength(1);
  });

  it("fills a partial discovery projection with safe defaults", () => {
    expect(toRestaurantView({ _id: "r1" })).toMatchObject({
      id: "r1",
      name: "Restaurant",
      cuisine: "Restaurant",
      cuisineSlug: "",
      description: "",
      coverImage: null,
      logo: null,
      gallery: [],
      rating: null,
      reviewCount: 0,
      deliveryEstimate: "30-45 min",
      currency: "RSD",
      deliveryFee: 250,
      minOrder: null,
      distance: null,
      availability: "closed",
      isOpen: false,
      phone: null,
      address: null,
      schedule: null,
    });
  });

  it("uses the cover image and logo for their own roles, falling back to each other", () => {
    const both = toRestaurantView({ _id: "r", profilePicture: "logo.png", images: ["", "cover.jpg"] });
    expect(both).toMatchObject({ coverImage: "cover.jpg", logo: "logo.png", gallery: ["cover.jpg"] });
    expect(toRestaurantView({ _id: "r", profilePicture: "logo.png" }).coverImage).toBe("logo.png");
    expect(toRestaurantView({ _id: "r", images: ["cover.jpg"] }).logo).toBe("cover.jpg");
  });

  it("derives availability from isActive and isOpenNow", () => {
    expect(toRestaurantView({ _id: "r", isOpenNow: true }).availability).toBe("open");
    expect(toRestaurantView({ _id: "r", isOpenNow: false }).availability).toBe("closed");
    expect(toRestaurantView({ _id: "r", isOpenNow: true, isActive: false }).availability).toBe("unavailable");
  });

  it("charges the delivery fee in the restaurant's currency", () => {
    expect(toRestaurantView({ _id: "r", currency: "eur" })).toMatchObject({ currency: "EUR", deliveryFee: 2.5 });
  });

  it("maps rating, cuisine, distance and address", () => {
    const view = toRestaurantView({
      _id: "r",
      averageRating: 4.6,
      totalReviews: "12",
      cuisineType: "Italian",
      distance: 420,
      address: { street: "Knez Mihailova 1", city: "Beograd", zipCode: "11000", country: "Serbia" },
    });
    expect(view).toMatchObject({ rating: 4.6, reviewCount: 12, cuisineSlug: "Italian", distance: 420 });
    expect(view.cuisine).not.toContain("taxonomy");
    expect(view.address).toEqual({
      street: "Knez Mihailova 1",
      city: "Beograd",
      zipCode: "11000",
      country: "Serbia",
      oneLine: "Knez Mihailova 1, Beograd, 11000",
    });
    expect(toRestaurantView({ _id: "r", averageRating: 0 }).rating).toBeNull();
  });

  it("builds the week with today flagged", () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_NOON);
    const view = toRestaurantView({ _id: "r", schedule: { tuesday: { isOpen: false } } });
    expect(view.schedule).toHaveLength(7);
    expect(view.schedule[0]).toEqual({
      day: "monday",
      label: "Monday",
      isOpen: true,
      opens: "09:00",
      closes: "22:00",
      isToday: true,
    });
    expect(view.schedule[1]).toMatchObject({ day: "tuesday", isOpen: false, isToday: false });
  });
});

describe("unavailableReason", () => {
  it("is null for an orderable or missing restaurant", () => {
    expect(unavailableReason(null)).toBeNull();
    expect(unavailableReason({ availability: "open" })).toBeNull();
  });

  it("explains a restaurant that is not accepting orders", () => {
    expect(unavailableReason({ availability: "unavailable" })).toBe(
      "This restaurant is not accepting orders at the moment.",
    );
  });

  it("names today's opening time when there is one", () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_NOON);
    const open = toRestaurantView({ _id: "r", schedule: { monday: { isOpen: true, openingTime: "17:00" } } });
    expect(unavailableReason(open)).toBe("Closed right now. Opens again at 17:00.");

    const shut = toRestaurantView({ _id: "r", schedule: { monday: { isOpen: false } } });
    expect(unavailableReason(shut)).toBe("Closed right now. Check the opening hours for the next slot.");
    expect(unavailableReason({ availability: "closed", schedule: null })).toBe(
      "Closed right now. Check the opening hours for the next slot.",
    );
  });
});
