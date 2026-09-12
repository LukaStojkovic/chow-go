/**
 * Product constants: taxonomies, navigation and filter options.
 *
 * Two things are deliberately separate here.
 *
 * The **value** is what the backend stores and matches on ("fast_food",
 * "Pizza", "apartment"). It is never translated - translating it would stop a
 * category chip from matching `MenuItem.category`, and would rewrite the enum
 * on the Restaurant model.
 *
 * The **label** is what a person reads, and lives in the `common:taxonomy`
 * catalog. Every export that produces one takes `t`, rather than baking copy
 * in at import time: a module-scope label would be captured in whichever
 * language happened to load first and would not change when the user switches.
 *
 * Icons stay string keys, not components - this module is consumed by both the
 * web and the native client, which draw from different icon packages. Each
 * client owns the key -> component map.
 *
 * @typedef {(key: string, options?: Object) => string} TFunction
 */

/**
 * Discovery category rail.
 *
 * `value` must match `MenuItem.category` as sellers actually store it. The
 * previous values ("burger", "japanese", "salad") matched nothing in the
 * database, so every chip silently returned an empty feed - the backend now
 * matches these case-insensitively so seller-typed casing still resolves.
 *
 * @type {{ id: string, value: string, icon: string }[]}
 */
export const CATEGORY_VALUES = [
  { id: "all", value: "All", icon: "all" },
  { id: "pizza", value: "Pizza", icon: "pizza" },
  { id: "burgers", value: "Burgers", icon: "burgers" },
  { id: "pasta", value: "Pasta", icon: "pasta" },
  { id: "salads", value: "Salads", icon: "salads" },
  { id: "grill", value: "Grill", icon: "grill" },
  { id: "sushi", value: "Sushi", icon: "sushi" },
  { id: "soups", value: "Soups", icon: "soups" },
  { id: "breakfast", value: "Breakfast", icon: "breakfast" },
  { id: "desserts", value: "Desserts", icon: "desserts" },
  { id: "drinks", value: "Drinks", icon: "drinks" },
];

/**
 * @param {TFunction} t
 * @returns {{ id: string, label: string, value: string, icon: string }[]}
 */
export function categoryOptions(t) {
  return CATEGORY_VALUES.map((category) => ({
    ...category,
    // "All" is a UI affordance rather than a stored category, so it reads from
    // its own key; the rest are keyed by the value the database holds.
    label: t(`common:taxonomy.category.${category.id === "all" ? "all" : category.value}`),
  }));
}

/**
 * Cuisine enum on the Restaurant model. Values must stay in sync with
 * `backend/models/Restaurant.js`.
 */
export const CUISINE_VALUES = [
  "fast_food",
  "italian",
  "chinese",
  "indian",
  "mexican",
  "japanese",
  "thai",
  "pizza",
  "burgers",
  "healthy",
  "desserts",
  "serbian",
  "mediterranean",
];

/**
 * A cuisine's display label, falling back to the stored value for a cuisine
 * added to the model but not yet to the catalog.
 *
 * @param {TFunction} t
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function cuisineLabel(t, value) {
  if (!value) return t("common:taxonomy.cuisine.fallback");
  const key = `common:taxonomy.cuisine.${value}`;
  const label = t(key);
  return label === key ? value : label;
}

/**
 * Select options for the seller signup and settings forms.
 *
 * @param {TFunction} t
 * @returns {{ value: string, label: string }[]}
 */
export function cuisineOptions(t) {
  return CUISINE_VALUES.map((value) => ({ value, label: cuisineLabel(t, value) }));
}

/** Sort options on the search results screen. */
export const SORT_VALUES = ["relevance", "rating", "delivery_time", "distance"];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string }[]}
 */
export function sortOptions(t) {
  return SORT_VALUES.map((value) => ({
    value,
    label: t(`common:taxonomy.sort.${value}`),
  }));
}

/** Delivery-time buckets offered as a search filter, in minutes. */
export const DELIVERY_TIME_VALUES = ["any", "30", "45", "60"];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string }[]}
 */
export function deliveryTimeFilters(t) {
  return DELIVERY_TIME_VALUES.map((value) => ({
    value,
    label: t(`common:taxonomy.deliveryTimeFilter.${value}`),
  }));
}

/** Delivery speed options at checkout. Mirrors the backend's `deliveryType`. */
export const DELIVERY_TYPE_VALUES = ["standard", "priority"];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string, description: string }[]}
 */
export function deliveryTypes(t) {
  return DELIVERY_TYPE_VALUES.map((value) => ({
    value,
    label: t(`common:taxonomy.deliveryType.${value}.label`),
    description: t(`common:taxonomy.deliveryType.${value}.description`),
  }));
}

/** Payment methods. Mirrors the `paymentMethod` enum on the Order model. */
export const PAYMENT_METHOD_VALUES = ["cash", "card"];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string, description: string }[]}
 */
export function paymentMethods(t) {
  return PAYMENT_METHOD_VALUES.map((value) => ({
    value,
    label: t(`common:taxonomy.paymentMethod.${value}.label`),
    description: t(`common:taxonomy.paymentMethod.${value}.description`),
  }));
}

/** Vehicle enum on the Courier model. */
export const VEHICLE_VALUES = ["bike", "scooter", "motorcycle", "car"];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string }[]}
 */
export function vehicleOptions(t) {
  return VEHICLE_VALUES.map((value) => ({
    value,
    label: t(`common:taxonomy.vehicle.${value}`),
  }));
}

/** How many saved addresses the backend allows (pre-save hook on Addresses). */
export const MAX_SAVED_ADDRESSES = 5;

/** Longest a delivery instruction may be, matching the checkout textarea. */
export const MAX_ORDER_NOTES = 500;

/**
 * Address type enum on the Addresses model, with the extra fields each type
 * asks for. `fields` is what a client renders under the type picker - a house
 * has a gate number and no apartment, a flat has a floor and no gate.
 *
 * @type {{ value: string, icon: string, fields: string[] }[]}
 */
export const ADDRESS_TYPE_VALUES = [
  {
    value: "apartment",
    icon: "apartment",
    fields: ["buildingName", "floor", "apartment", "entrance"],
  },
  { value: "house", icon: "house", fields: ["entrance", "doorCode"] },
  { value: "office", icon: "office", fields: ["buildingName"] },
  { value: "hotel", icon: "hotel", fields: ["buildingName"] },
  { value: "other", icon: "other", fields: ["buildingName"] },
];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string, icon: string, fields: string[] }[]}
 */
export function addressTypes(t) {
  return ADDRESS_TYPE_VALUES.map((type) => ({
    ...type,
    label: t(`common:taxonomy.addressType.${type.value}`),
  }));
}

/**
 * What an address is saved as. `Addresses.label` is a free string, so `value`
 * is stored verbatim in English and only the display label is translated -
 * a Serbian user's "Kuća" is still "Home" in the database, which is what keeps
 * the label meaningful after they switch language.
 *
 * @type {{ value: string, icon: string }[]}
 */
export const ADDRESS_LABEL_VALUES = [
  { value: "Home", icon: "home" },
  { value: "Work", icon: "work" },
  { value: "Partner", icon: "partner" },
  { value: "Other", icon: "other" },
];

/**
 * @param {TFunction} t
 * @returns {{ value: string, label: string, icon: string }[]}
 */
export function addressLabels(t) {
  return ADDRESS_LABEL_VALUES.map((option) => ({
    ...option,
    label: t(`common:taxonomy.addressLabel.${option.value}`),
  }));
}

/**
 * Rows written before the label list existed carry "home" rather than "Home",
 * so the stored value is matched case-insensitively.
 *
 * @param {string | null | undefined} stored
 * @returns {string} One of `ADDRESS_LABEL_VALUES`' values.
 */
export function matchAddressLabelValue(stored) {
  const found = ADDRESS_LABEL_VALUES.find(
    (option) => option.value.toLowerCase() === String(stored ?? "").toLowerCase(),
  );
  return found?.value ?? "Other";
}

/**
 * Display text for a stored address label. A seller-typed custom label that
 * matches nothing in the list is shown as they wrote it.
 *
 * @param {TFunction} t
 * @param {string | null | undefined} stored
 * @returns {string}
 */
export function addressLabelText(t, stored) {
  const raw = String(stored ?? "").trim();
  const known = ADDRESS_LABEL_VALUES.find(
    (option) => option.value.toLowerCase() === raw.toLowerCase(),
  );
  return known ? t(`common:taxonomy.addressLabel.${known.value}`) : raw;
}
