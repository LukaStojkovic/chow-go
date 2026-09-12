/**
 * Display formatting for money, distance, time and counts.
 *
 * Everything here follows the *active UI language*, not the device locale:
 * a Serbian user reading the app in English should see the separators the rest
 * of the screen uses. Formatters are cached per locale because building an
 * `Intl.NumberFormat` is expensive enough to show up in a long menu list.
 *
 * The currency itself does not follow the language. `Order.total` is a plain
 * number in one currency, and switching to Serbian must not silently reprice
 * it - only the separators and symbol placement change.
 */

import { CURRENCY_CODE, intlLocale } from "./i18n/config.js";
import { currentLocale, t } from "./i18n/index.js";

export { CURRENCY_CODE };

/** @deprecated Kept so existing imports keep resolving; read `CURRENCY_CODE`. */
export const CURRENCY = {
  code: CURRENCY_CODE,
  get locale() {
    return intlLocale(currentLocale());
  },
};

const numberFormatters = new Map();

/**
 * @param {Intl.NumberFormatOptions} options
 * @returns {Intl.NumberFormat}
 */
function numberFormatter(options) {
  const locale = intlLocale(currentLocale());
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

const dateFormatters = new Map();

/**
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {Intl.DateTimeFormat}
 */
function dateFormatter(options) {
  const locale = intlLocale(currentLocale());
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

const PRICE_OPTIONS = {
  style: "currency",
  currency: CURRENCY_CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Format a money amount for display.
 *
 * @param {number | null | undefined} amount
 * @param {{ fallback?: string }} [options]
 * @returns {string}
 */
export function formatPrice(amount, { fallback = "-" } = {}) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return fallback;
  return numberFormatter(PRICE_OPTIONS).format(amount);
}

/**
 * A fee, where zero reads as "Free" rather than as an amount.
 *
 * @param {number | null | undefined} amount
 * @param {{ freeLabel?: string }} [options]
 * @returns {string}
 */
export function formatFee(amount, { freeLabel } = {}) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "-";
  if (amount === 0) return freeLabel ?? t("common:units.free");
  return numberFormatter(PRICE_OPTIONS).format(amount);
}

/**
 * Distance for a discovery card. Buckets to 50 m so two restaurants on the
 * same street do not appear to be ranked by a metre.
 *
 * @param {number | null | undefined} metres
 * @returns {string | null}
 */
export function formatDistance(metres) {
  if (typeof metres !== "number" || Number.isNaN(metres)) return null;
  if (metres < 1000) {
    return t("common:units.metres", { value: Math.round(metres / 50) * 50 });
  }
  return t("common:units.kilometres", {
    value: numberFormatter({
      minimumFractionDigits: metres < 10000 ? 1 : 0,
      maximumFractionDigits: metres < 10000 ? 1 : 0,
    }).format(metres / 1000),
  });
}

/**
 * A seller writes a delivery estimate as free text ("30-45"). Add the unit
 * when they have not, and otherwise leave what they typed alone.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function formatDeliveryEstimate(value) {
  if (!value || typeof value !== "string") {
    return t("common:units.minutesRange", { from: 30, to: 45 });
  }
  const trimmed = value.trim();
  // Recognise a unit the seller already typed, in either language.
  if (/min|h\b|hour|sat|čas|cas/i.test(trimmed)) return trimmed;
  return t("common:units.minutes", { value: trimmed });
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
 * Clock time. English renders "7:45 PM", Serbian "19:45" - `Intl` decides,
 * because hour-cycle is a property of the locale and not a product choice.
 *
 * @param {string | Date | null | undefined} value
 * @returns {string | null}
 */
export function formatTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter({ hour: "numeric", minute: "2-digit" }).format(date);
}

/**
 * Calendar date, e.g. "12 Mar 2026" / "12. mar 2026.".
 *
 * @param {string | Date | null | undefined} value
 * @returns {string | null}
 */
export function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter({ day: "numeric", month: "short", year: "numeric" }).format(date);
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
  const time = formatTime(date);

  if (date.toDateString() === now.toDateString()) {
    return t("order:placedRelative.today", { time });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t("order:placedRelative.yesterday", { time });
  }

  return t("order:placedRelative.older", { date: formatDate(date), time });
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
  return numberFormatter({
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Review counts, abbreviated once they stop being worth reading precisely.
 *
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatReviewCount(value) {
  if (typeof value !== "number" || value <= 0) return "0";
  if (value < 1000) return numberFormatter({}).format(value);
  return `${numberFormatter({
    minimumFractionDigits: value < 10000 ? 1 : 0,
    maximumFractionDigits: value < 10000 ? 1 : 0,
  }).format(value / 1000)}k`;
}

/**
 * A whole number with the locale's grouping separator (1,204 / 1.204).
 *
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatCount(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return numberFormatter({ maximumFractionDigits: 0 }).format(value);
}

/**
 * A percentage, e.g. "25%".
 *
 * @param {number | null | undefined} value
 * @param {{ fractionDigits?: number }} [options]
 * @returns {string}
 */
export function formatPercent(value, { fractionDigits = 0 } = {}) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return numberFormatter({
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value / 100);
}

/**
 * Turn a snake_case enum from the API into human text ("in_transit" ->
 * "In transit"). Used only where no explicit copy exists for the value, and so
 * deliberately left unlocalised: it is a last-resort rendering of a raw enum,
 * not product copy.
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
 * Title-case a menu category slug for section headings. A seller writes their
 * own category names, so this formats what they typed rather than translating
 * it - their menu reads the way they wrote it in either language.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function titleCase(value) {
  if (!value || typeof value !== "string") return "";
  const locale = intlLocale(currentLocale());
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase(locale) + word.slice(1))
    .join(" ");
}
