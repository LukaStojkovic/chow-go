import { AppError } from "./AppError.js";

export const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DEFAULT_OPENING_TIME = "09:00";
export const DEFAULT_CLOSING_TIME = "22:00";

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeString(value) {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getDayKey(date = new Date()) {
  return DAYS_OF_WEEK[date.getDay()];
}

function parseBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === undefined || value === "") return fallback;
  return fallback;
}

export function buildScheduleFromRange(openingTime, closingTime) {
  const opening = isValidTimeString(openingTime)
    ? openingTime
    : DEFAULT_OPENING_TIME;
  const closing = isValidTimeString(closingTime)
    ? closingTime
    : DEFAULT_CLOSING_TIME;

  return Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [
      day,
      { isOpen: true, openingTime: opening, closingTime: closing },
    ]),
  );
}

export function buildDefaultSchedule() {
  return buildScheduleFromRange(DEFAULT_OPENING_TIME, DEFAULT_CLOSING_TIME);
}

export function normalizeScheduleInput(rawSchedule) {
  let parsed = rawSchedule;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new AppError("Schedule must be valid JSON", 400);
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AppError("Schedule must be an object keyed by day of week", 400);
  }

  const normalized = {};

  for (const [rawDay, rawEntry] of Object.entries(parsed)) {
    const day = rawDay.toLowerCase();

    if (!DAYS_OF_WEEK.includes(day)) {
      throw new AppError(`"${rawDay}" is not a valid day of the week`, 400);
    }

    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
      throw new AppError(`Schedule for ${day} must be an object`, 400);
    }

    const entry = {};

    if (rawEntry.isOpen !== undefined) {
      entry.isOpen = parseBoolean(rawEntry.isOpen, true);
    }
    for (const field of ["openingTime", "closingTime"]) {
      if (rawEntry[field] === undefined || rawEntry[field] === "") continue;

      if (!isValidTimeString(rawEntry[field])) {
        throw new AppError(
          `${field} for ${day} must be in 24-hour HH:MM format`,
          400,
        );
      }

      entry[field] = rawEntry[field];
    }

    if (Object.keys(entry).length > 0) {
      normalized[day] = entry;
    }
  }

  if (Object.keys(normalized).length === 0) {
    throw new AppError("Schedule contained no updatable values", 400);
  }

  return normalized;
}

function isWithinWindow(day, nowMinutes, spilloverOnly) {
  if (!day?.isOpen) return false;
  if (!isValidTimeString(day.openingTime)) return false;
  if (!isValidTimeString(day.closingTime)) return false;

  const open = toMinutes(day.openingTime);
  const close = toMinutes(day.closingTime);

  if (open === close) return !spilloverOnly;

  if (close > open) {
    return spilloverOnly ? false : nowMinutes >= open && nowMinutes < close;
  }

  return spilloverOnly ? nowMinutes < close : nowMinutes >= open;
}

/** Fallback for restaurants stored before timezone existed on the model. */
export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Europe/Belgrade";

const WEEKDAY_INDEX = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * The wall-clock day and time at an instant, in a named zone.
 *
 * This used to be date.getHours() and date.getDay() - the *server's* local
 * time. Deployed on UTC infrastructure, every restaurant's opening hours were
 * an hour or two out, and since createOrder rejects on isOpenNow that silently
 * refused real orders. Intl carries the zone database, so no dependency.
 */
function zonedNow(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const get = (type) => parts.find((part) => part.type === type)?.value;
    const dayIndex = WEEKDAY_INDEX[get("weekday")];
    // "24" appears at midnight in some ICU versions.
    const hours = Number(get("hour")) % 24;
    const minutes = Number(get("minute"));

    if (dayIndex === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new Error("unparseable");
    }
    return { dayIndex, minutes: hours * 60 + minutes };
  } catch {
    // An invalid zone should not close a restaurant; fall back to the server.
    return { dayIndex: date.getDay(), minutes: date.getHours() * 60 + date.getMinutes() };
  }
}

export function isOpenAt(schedule, date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  if (!schedule) return false;

  const { dayIndex, minutes: nowMinutes } = zonedNow(date, timeZone);
  const yesterdayIndex = (dayIndex + 6) % 7;

  return (
    isWithinWindow(schedule[DAYS_OF_WEEK[dayIndex]], nowMinutes, false) ||
    isWithinWindow(schedule[DAYS_OF_WEEK[yesterdayIndex]], nowMinutes, true)
  );
}
