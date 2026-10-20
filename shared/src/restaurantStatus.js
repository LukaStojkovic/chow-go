import { isOpenAt } from "./scheduling.js";

/**
 * A seller's short-term overrides on top of the weekly schedule: "busy" adds prep time for a
 * while, "pause" stops new orders for a while (or until they resume). Both are stored on the
 * restaurant as `busy: { extraMinutes, until }` and `pause: { until, indefinite, reason }`.
 */

export const STATUS_LIMITS = {
  busyExtra: { min: 5, max: 60 },
  busyMinutes: { min: 15, max: 240 },
  pauseMinutes: { min: 5, max: 24 * 60 },
  reasonLength: 80,
};

export const BUSY_EXTRA_OPTIONS = [10, 15, 20, 30, 45];
export const BUSY_DURATION_OPTIONS = [30, 60, 120];
export const PAUSE_OPTIONS = [15, 30, 60, 120, "endOfDay", "indefinite"];

const at = (value) => (value ? new Date(value) : null);

/** The pause in force at `now`, or null. */
export function pauseState(restaurant, now = new Date()) {
  const pause = restaurant?.pause;
  if (!pause) return null;
  if (pause.indefinite) return { until: null, indefinite: true, reason: pause.reason || "" };
  const until = at(pause.until);
  if (!until || until <= now) return null;
  return { until, indefinite: false, reason: pause.reason || "" };
}

/** The busy period in force at `now`, or null. */
export function busyState(restaurant, now = new Date()) {
  const busy = restaurant?.busy;
  const until = at(busy?.until);
  const extra = Number(busy?.extraMinutes) || 0;
  if (!until || until <= now || extra <= 0) return null;
  return { until, extraMinutes: extra };
}

export function busyExtraMinutes(restaurant, now = new Date()) {
  return busyState(restaurant, now)?.extraMinutes ?? 0;
}

/** Open by its schedule and closures, and not paused. */
export function isAcceptingAt(restaurant, date = new Date()) {
  if (pauseState(restaurant, date)) return false;
  return isOpenAt(restaurant?.schedule, date, restaurant?.timezone, restaurant?.closures);
}

/** "30-45 min" plus 15 is "45-60 min"; text without numbers is left alone. */
export function addMinutesToEstimate(estimate, extra) {
  if (!extra) return estimate;
  return String(estimate ?? "").replace(/\d+/g, (n) => String(Number(n) + extra));
}
