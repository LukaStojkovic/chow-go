/**
 * Product constants: taxonomies, navigation and filter options.
 *
 * Category icons are Lucide components, not emoji - emoji render differently
 * on every platform, cannot inherit `currentColor`, and are announced as their
 * unicode name by screen readers.
 */

import {
  Beef,
  CakeSlice,
  CookingPot,
  Croissant,
  CupSoda,
  Fish,
  Flame,
  LayoutGrid,
  Pizza,
  Salad,
  Soup,
} from "lucide-react";

/**
 * Discovery category rail.
 *
 * `value` must match `MenuItem.category` as sellers actually store it. The
 * previous values ("burger", "japanese", "salad") matched nothing in the
 * database, so every chip silently returned an empty feed - the backend now
 * matches these case-insensitively so seller-typed casing still resolves.
 *
 * @type {{ id: string, label: string, value: string, icon: import("lucide-react").LucideIcon }[]}
 */
export const CATEGORIES = [
  { id: "all", label: "All", value: "All", icon: LayoutGrid },
  { id: "pizza", label: "Pizza", value: "Pizza", icon: Pizza },
  { id: "burgers", label: "Burgers", value: "Burgers", icon: Beef },
  { id: "pasta", label: "Pasta", value: "Pasta", icon: CookingPot },
  { id: "salads", label: "Salads", value: "Salads", icon: Salad },
  { id: "grill", label: "Grill", value: "Grill", icon: Flame },
  { id: "sushi", label: "Sushi", value: "Sushi", icon: Fish },
  { id: "soups", label: "Soups", value: "Soups", icon: Soup },
  { id: "breakfast", label: "Breakfast", value: "Breakfast", icon: Croissant },
  { id: "desserts", label: "Desserts", value: "Desserts", icon: CakeSlice },
  { id: "drinks", label: "Drinks", value: "Drinks", icon: CupSoda },
];

/**
 * Cuisine enum on the Restaurant model, mapped to display labels.
 * Keys must stay in sync with `backend/models/Restaurant.js`.
 */
export const CUISINE_LABELS = {
  fast_food: "Fast food",
  italian: "Italian",
  chinese: "Chinese",
  indian: "Indian",
  mexican: "Mexican",
  japanese: "Japanese",
  thai: "Thai",
  pizza: "Pizza",
  burgers: "Burgers",
  healthy: "Healthy",
  desserts: "Desserts",
  serbian: "Serbian",
  mediterranean: "Mediterranean",
};

/** Select options for the seller signup and settings forms. */
export const cuisineOptions = Object.entries(CUISINE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/** Sort options on the search results screen. */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Most relevant" },
  { value: "rating", label: "Highest rated" },
  { value: "delivery_time", label: "Fastest delivery" },
  { value: "distance", label: "Closest to me" },
];

/** Delivery-time buckets offered as a search filter, in minutes. */
export const DELIVERY_TIME_FILTERS = [
  { value: "any", label: "Any time" },
  { value: "30", label: "Under 30 min" },
  { value: "45", label: "Under 45 min" },
  { value: "60", label: "Under 1 hour" },
];

/** Delivery speed options at checkout. Mirrors the backend's `deliveryType`. */
export const DELIVERY_TYPES = [
  {
    value: "standard",
    label: "Standard",
    description: "Arrives within the restaurant's usual delivery window.",
  },
  {
    value: "priority",
    label: "Priority",
    description: "Moved to the front of the courier queue.",
  },
];

/** Payment methods. Mirrors the `paymentMethod` enum on the Order model. */
export const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Cash on delivery",
    description: "Pay the courier when your order arrives.",
  },
  {
    value: "card",
    label: "Card",
    description: "Pay by card when your order arrives.",
  },
];

/** How many saved addresses the backend allows (pre-save hook on Addresses). */
export const MAX_SAVED_ADDRESSES = 5;

/** Longest a delivery instruction may be, matching the checkout textarea. */
export const MAX_ORDER_NOTES = 500;
