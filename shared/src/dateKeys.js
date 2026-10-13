/**
 * Calendar dates as "YYYY-MM-DD" keys. A key names a local day in whatever zone
 * produced it, so arithmetic on keys never crosses a DST change.
 */

const KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (key) => {
  const [, y, m, d] = KEY.exec(key);
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
};
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

export function isDateKey(value) {
  if (typeof value !== "string" || !KEY.test(value)) return false;
  return fromUtc(toUtc(value)) === value;
}

export function addDays(key, days) {
  return fromUtc(toUtc(key) + days * DAY_MS);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** 0 = Monday ... 6 = Sunday. */
export function isoWeekday(key) {
  return (new Date(toUtc(key)).getUTCDay() + 6) % 7;
}

/** The Monday that starts the week holding `key`. */
export function weekStartKey(key) {
  return addDays(key, -isoWeekday(key));
}

export function monthStartKey(key) {
  return `${key.slice(0, 8)}01`;
}

export function addMonths(key, months) {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return fromUtc(date.getTime());
}

/** The local date of an instant in a zone, falling back to UTC for an unusable zone. */
export function zonedDateKey(date = new Date(), timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
      new Date(date),
    );
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}
