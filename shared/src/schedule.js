/**
 * Opening-hours display helpers.
 *
 * Day names and "Closed"/"Open 24 hours" come from the `common:taxonomy.day`
 * and `restaurant:hours` catalogs. Clock formatting follows the locale too:
 * English reads 9:00 PM, Serbian reads 21:00, and that difference is
 * `Intl`'s to decide rather than ours.
 */

import { intlLocale } from "./i18n/config.js";
import { currentLocale, t } from "./i18n/index.js";

export const DEFAULT_OPENING_TIME = "09:00";
export const DEFAULT_CLOSING_TIME = "22:00";

/**
 * The week, Monday first, in the order the seller's settings form lists it.
 * `key` is what `Restaurant.schedule` stores; labels come from the catalog.
 */
export const WEEK_DAYS = [
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
  { key: "saturday" },
  { key: "sunday" },
];

const DAY_KEYS_BY_INDEX = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * @param {string} key
 * @returns {string} e.g. "Monday" / "Ponedeljak".
 */
export function dayLabel(key) {
  return t(`common:taxonomy.day.${key}.label`, { defaultValue: key });
}

/**
 * @param {string} key
 * @returns {string} e.g. "Mon" / "Pon".
 */
export function dayShortLabel(key) {
  return t(`common:taxonomy.day.${key}.short`, { defaultValue: key.slice(0, 3) });
}

/**
 * The week with labels resolved, for a form that renders one row per day.
 *
 * @returns {{ key: string, label: string, short: string }[]}
 */
export function weekDays() {
  return WEEK_DAYS.map(({ key }) => ({
    key,
    label: dayLabel(key),
    short: dayShortLabel(key),
  }));
}

export function getTodayKey(date = new Date()) {
  return DAY_KEYS_BY_INDEX[date.getDay()];
}

export function normalizeSchedule(schedule) {
  return WEEK_DAYS.reduce((acc, { key }) => {
    const entry = schedule?.[key];

    acc[key] = {
      isOpen: entry?.isOpen ?? true,
      openingTime: entry?.openingTime || DEFAULT_OPENING_TIME,
      closingTime: entry?.closingTime || DEFAULT_CLOSING_TIME,
    };

    return acc;
  }, {});
}

const clockCache = new Map();

/**
 * Render an "HH:MM" string the way the current locale writes a time.
 *
 * The stored value stays 24-hour in every language - only the display changes,
 * so a seller who sets 21:00 and an English customer who reads 9:00 PM are
 * looking at the same row.
 *
 * @param {string | null | undefined} time
 * @returns {string}
 */
export function formatClock(time) {
  if (!time || typeof time !== "string" || !time.includes(":")) return "--";

  const [rawHours, rawMinutes] = time.split(":");
  const hours = parseInt(rawHours, 10);
  const minutes = parseInt(rawMinutes, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "--";

  const locale = intlLocale(currentLocale());
  let formatter = clockCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
    clockCache.set(locale, formatter);
  }

  // An arbitrary date: only the time-of-day fields are rendered.
  return formatter.format(new Date(2000, 0, 1, hours, minutes));
}

/**
 * One day's hours as a single line.
 *
 * @param {{ isOpen?: boolean, openingTime?: string, closingTime?: string } | null} entry
 * @returns {string}
 */
export function formatDayHours(entry) {
  if (!entry?.isOpen) return t("restaurant:hours.closed");

  if (entry.openingTime === entry.closingTime) {
    return t("restaurant:hours.allDay");
  }

  return t("restaurant:hours.range", {
    from: formatClock(entry.openingTime),
    to: formatClock(entry.closingTime),
  });
}

export function isOvernight(entry) {
  if (!entry?.isOpen) return false;
  if (!entry.openingTime || !entry.closingTime) return false;
  if (entry.openingTime === entry.closingTime) return false;

  return entry.closingTime < entry.openingTime;
}
