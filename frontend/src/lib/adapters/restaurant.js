/**
 * Restaurant view-model adapter.
 *
 * The Restaurant document has no `deliveryFee`, `minOrder`, `promoted` or
 * `priceLevel` field, yet the old UI rendered all four from literals scattered
 * through the components. Everything the product needs that the API does not
 * provide is resolved here, once, and labelled.
 */

import { CUISINE_LABELS } from "@/lib/constants";
import { PRICING } from "./pricing";
import { WEEK_DAYS, getTodayKey, normalizeSchedule } from "@/utils/scheduleUtils";

/** @typedef {import("./types").RestaurantView} RestaurantView */
/** @typedef {import("./types").AddressView} AddressView */

/**
 * @param {Object | null | undefined} raw
 * @returns {AddressView | null}
 */
function toAddress(raw) {
  if (!raw) return null;
  const parts = [raw.street, raw.city, raw.zipCode].filter(Boolean);
  return {
    street: raw.street || "",
    city: raw.city || "",
    zipCode: raw.zipCode || null,
    country: raw.country || null,
    oneLine: parts.join(", "),
  };
}

/**
 * @param {Object | null | undefined} raw
 * @returns {import("./types").WeeklySchedule | null}
 */
function toSchedule(raw) {
  if (!raw) return null;
  const normalised = normalizeSchedule(raw);
  const today = getTodayKey();

  return WEEK_DAYS.map(({ key, label }) => ({
    day: key,
    label,
    isOpen: normalised[key].isOpen,
    opens: normalised[key].openingTime,
    closes: normalised[key].closingTime,
    isToday: key === today,
  }));
}

/**
 * Normalise a restaurant document, from any endpoint, into the shape the UI
 * reads. Safe to call with partial projections - the discovery feed only
 * populates name, picture, rating and delivery estimate.
 *
 * @param {Object | null | undefined} raw
 * @returns {RestaurantView | null}
 */
export function toRestaurantView(raw) {
  if (!raw || !raw._id) return null;

  const gallery = Array.isArray(raw.images) ? raw.images.filter(Boolean) : [];
  const isActive = raw.isActive !== false;
  const isOpen = Boolean(raw.isOpenNow);

  /** @type {import("./types").RestaurantAvailability} */
  let availability = "open";
  if (!isActive) availability = "unavailable";
  else if (!isOpen) availability = "closed";

  return {
    id: String(raw._id),
    name: raw.name || "Restaurant",
    cuisine: CUISINE_LABELS[raw.cuisineType] || raw.cuisineType || "Restaurant",
    cuisineSlug: raw.cuisineType || "",
    description: raw.description || "",
    // `profilePicture` is the logo; `images[0]` is the cover shot. Older
    // screens used the logo for both, which is why hero images looked cropped.
    coverImage: gallery[0] || raw.profilePicture || null,
    logo: raw.profilePicture || gallery[0] || null,
    gallery,
    rating:
      typeof raw.averageRating === "number" && raw.averageRating > 0
        ? raw.averageRating
        : null,
    reviewCount: Number(raw.totalReviews) || 0,
    deliveryEstimate: raw.estimatedDeliveryTime || "30-45 min",
    // Not per-restaurant on the backend: every order is charged the same flat
    // platform fee. Showing that value is accurate; inventing a varying one
    // would not be.
    deliveryFee: PRICING.deliveryFee,
    // No minimum order is modelled or enforced. `null` means "do not render a
    // minimum-order line", never "0".
    minOrder: PRICING.minimumOrder,
    // Only the /nearby aggregation projects a distance, in metres.
    distance: typeof raw.distance === "number" ? raw.distance : null,
    availability,
    isOpen,
    phone: raw.phone || null,
    address: toAddress(raw.address),
    schedule: toSchedule(raw.schedule),
  };
}

/**
 * @param {unknown} list
 * @returns {RestaurantView[]}
 */
export function toRestaurantViews(list) {
  if (!Array.isArray(list)) return [];
  return list.map(toRestaurantView).filter(Boolean);
}

/**
 * Copy explaining why a restaurant cannot be ordered from right now, or `null`
 * when it can. Drives both the card badge and the disabled add-to-basket
 * controls, so the two can never disagree.
 *
 * @param {RestaurantView | null} restaurant
 * @returns {string | null}
 */
export function unavailableReason(restaurant) {
  if (!restaurant) return null;
  if (restaurant.availability === "unavailable") {
    return "This restaurant is not accepting orders at the moment.";
  }
  if (restaurant.availability === "closed") {
    const todayEntry = restaurant.schedule?.find((day) => day.isToday);
    if (todayEntry?.isOpen) {
      return `Closed right now. Opens again at ${todayEntry.opens}.`;
    }
    return "Closed right now. Check the opening hours for the next slot.";
  }
  return null;
}
