import { isOpenAt as sharedIsOpenAt } from "@chowgo/shared/scheduling";
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

/** Fallback for restaurants stored before timezone existed on the model. */
export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Europe/Belgrade";

// One implementation for the backend and both clients: @chowgo/shared/scheduling.
export function isOpenAt(schedule, date = new Date(), timeZone = DEFAULT_TIMEZONE, closures = null) {
  return sharedIsOpenAt(schedule, date, timeZone || DEFAULT_TIMEZONE, closures);
}
