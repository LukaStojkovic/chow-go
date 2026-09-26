import { DEFAULT_TIMEZONE } from "./schedule.js";

/**
 * Calendar boundaries in a named zone. Reporting bucketed by the host clock,
 * which on a UTC server moved every sale between 22:00 and 02:00 in Belgrade
 * onto the wrong day and made "today" start at 01:00 or 02:00 local.
 */

export function resolveTimeZone(timeZone) {
  if (!timeZone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

function offsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant a local wall-clock date begins, correct across DST changes. */
function zonedMidnight(year, month, day, timeZone) {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

export function dateKey(date, timeZone) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function startOfDay(date, timeZone, daysBack = 0) {
  const p = zonedParts(date, timeZone);
  return zonedMidnight(p.year, p.month, p.day - daysBack, timeZone);
}

/** Sunday-first, matching $dayOfWeek. */
export function startOfWeek(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return zonedMidnight(p.year, p.month, p.day - dow, timeZone);
}

export function startOfMonth(date, timeZone) {
  const p = zonedParts(date, timeZone);
  return zonedMidnight(p.year, p.month, 1, timeZone);
}

/** The last `n` local dates, oldest first, as YYYY-MM-DD keys. */
export function lastDateKeys(n, timeZone, now = new Date()) {
  return Array.from({ length: n }, (_, i) =>
    dateKey(new Date(startOfDay(now, timeZone, n - 1 - i).getTime() + 12 * 3600 * 1000), timeZone),
  );
}
