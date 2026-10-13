import { addDays, addMonths, daysBetween, isDateKey, monthStartKey, weekStartKey } from "./dateKeys.js";

export const REPORT_LIMITS = { maxDays: 366, defaultDays: 30, dailyUpTo: 62, weeklyUpTo: 186 };

export const RANGE_PRESETS = ["today", "last7", "last30", "thisMonth", "lastMonth", "last90", "thisYear"];

/** Inclusive from/to keys for a named preset, ending today. */
export function presetRange(preset, todayKey) {
  switch (preset) {
    case "today":
      return { from: todayKey, to: todayKey };
    case "last7":
      return { from: addDays(todayKey, -6), to: todayKey };
    case "thisMonth":
      return { from: monthStartKey(todayKey), to: todayKey };
    case "lastMonth": {
      const from = addMonths(monthStartKey(todayKey), -1);
      return { from, to: addDays(monthStartKey(todayKey), -1) };
    }
    case "last90":
      return { from: addDays(todayKey, -89), to: todayKey };
    case "thisYear":
      return { from: `${todayKey.slice(0, 4)}-01-01`, to: todayKey };
    case "last30":
    default:
      return { from: addDays(todayKey, -(REPORT_LIMITS.defaultDays - 1)), to: todayKey };
  }
}

/** The preset a range matches, or "custom". */
export function presetFor({ from, to }, todayKey) {
  return RANGE_PRESETS.find((p) => {
    const r = presetRange(p, todayKey);
    return r.from === from && r.to === to;
  }) ?? "custom";
}

export function granularityFor(days) {
  if (days <= REPORT_LIMITS.dailyUpTo) return "day";
  if (days <= REPORT_LIMITS.weeklyUpTo) return "week";
  return "month";
}

/**
 * Reads `from`/`to` (inclusive local dates) or a `preset`. Missing values fall back to the last 30
 * days; a `to` in the future is clamped to today. Returns `{ range }` or `{ error: { code } }` with
 * REPORT_RANGE_INVALID or REPORT_RANGE_TOO_LONG.
 */
export function parseReportRange(query = {}, todayKey) {
  if (query.preset && RANGE_PRESETS.includes(query.preset) && !query.from && !query.to) {
    return { range: withMeta(presetRange(query.preset, todayKey)) };
  }
  const fallback = presetRange("last30", todayKey);
  const from = query.from ?? fallback.from;
  let to = query.to ?? (query.from ? todayKey : fallback.to);
  if (!isDateKey(from) || !isDateKey(to)) return { error: { code: "REPORT_RANGE_INVALID" } };
  if (daysBetween(todayKey, to) > 0) to = todayKey;
  if (daysBetween(from, to) < 0) return { error: { code: "REPORT_RANGE_INVALID" } };
  if (daysBetween(from, to) + 1 > REPORT_LIMITS.maxDays) return { error: { code: "REPORT_RANGE_TOO_LONG", max: REPORT_LIMITS.maxDays } };
  return { range: withMeta({ from, to }) };
}

function withMeta({ from, to }) {
  const days = daysBetween(from, to) + 1;
  return { from, to, days, granularity: granularityFor(days) };
}

/** The same-length range just before this one, for comparison. */
export function previousRange({ from, days }) {
  return withMeta({ from: addDays(from, -days), to: addDays(from, -1) });
}

/** Every bucket key in a range: each day, each week's Monday, or each month's first day. */
export function bucketKeys({ from, to, granularity }) {
  const keys = [];
  if (granularity === "day") {
    for (let key = from; daysBetween(key, to) >= 0; key = addDays(key, 1)) keys.push(key);
  } else if (granularity === "week") {
    for (let key = weekStartKey(from); daysBetween(key, to) >= 0; key = addDays(key, 7)) keys.push(key);
  } else {
    for (let key = monthStartKey(from); daysBetween(key, to) >= 0; key = addMonths(key, 1)) keys.push(key);
  }
  return keys;
}
