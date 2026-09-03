/**
 * Presentation formatting.
 *
 * Every price, distance, delivery estimate and date the customer sees goes
 * through this module. Nothing else in the app should call `toFixed(2)` or
 * concatenate a currency symbol by hand - that is how basket, checkout and
 * confirmation drift apart from each other.
 */

/**
 * The single place currency is decided.
 *
 * Menu prices are stored as bare `Number`s with no currency on the document,
 * and the seed data uses USD-style values (14.99). Switching the whole product
 * to RSD is a change to these three lines plus a data migration - not a
 * find-and-replace across components.
 */
export const CURRENCY = {
  code: "USD",
  locale: "en-US",
};

const priceFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a money amount for display.
 *
 * @param {number | null | undefined} amount
 * @param {{ fallback?: string }} [options]
 * @returns {string}
 */
export function formatPrice(amount, { fallback = "-" } = {}) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return fallback;
  return priceFormatter.format(amount);
}

/**
 * Format a fee, where zero is a selling point rather than a number.
 *
 * @param {number | null | undefined} amount
 * @param {{ freeLabel?: string }} [options]
 * @returns {string}
 */
export function formatFee(amount, { freeLabel = "Free" } = {}) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "-";
  if (amount === 0) return freeLabel;
  return priceFormatter.format(amount);
}

/**
 * Distances arrive from the API in metres.
 *
 * @param {number | null | undefined} metres
 * @returns {string | null}
 */
export function formatDistance(metres) {
  if (typeof metres !== "number" || Number.isNaN(metres)) return null;
  if (metres < 1000) return `${Math.round(metres / 50) * 50} m`;
  return `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)} km`;
}

/**
 * `estimatedDeliveryTime` is a free-text string on the Restaurant document
 * ("30-45 min"). Normalise the shapes sellers actually type so the card always
 * reads the same way.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function formatDeliveryEstimate(value) {
  if (!value || typeof value !== "string") return "30-45 min";
  const trimmed = value.trim();
  if (/min|h\b|hour/i.test(trimmed)) return trimmed;
  return `${trimmed} min`;
}

/**
 * Minutes remaining until a target time, floored at zero.
 *
 * @param {string | Date | null | undefined} target
 * @returns {number | null}
 */
export function minutesUntil(target) {
  if (!target) return null;
  const then = new Date(target).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((then - Date.now()) / 60000));
}

/**
 * Clock time, e.g. "19:45".
 *
 * @param {string | Date | null | undefined} value
 * @returns {string | null}
 */
export function formatTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(CURRENCY.locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Calendar date, e.g. "12 Mar 2026".
 *
 * @param {string | Date | null | undefined} value
 * @returns {string | null}
 */
export function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(CURRENCY.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Order-history timestamps: recent orders read relatively, older ones by date.
 *
 * @param {string | Date | null | undefined} value
 * @returns {string}
 */
export function formatOrderDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) return `Today, ${formatTime(date)}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${formatTime(date)}`;
  }

  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * Ratings render to one decimal so cards stay comparable at a glance.
 *
 * @param {number | null | undefined} value
 * @returns {string | null}
 */
export function formatRating(value) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return null;
  }
  return value.toFixed(1);
}

/**
 * Review counts, abbreviated once they stop being worth reading precisely.
 *
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatReviewCount(value) {
  if (typeof value !== "number" || value <= 0) return "0";
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}k`;
}

/**
 * Turn a snake_case enum from the API into human text ("in_transit" ->
 * "In transit"). Used only where no explicit copy exists for the value.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function humanise(value) {
  if (!value || typeof value !== "string") return "";
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Title-case a menu category slug for section headings.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function titleCase(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
