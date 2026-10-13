import { currentLocale, intlLocale } from "@chowgo/shared/i18n";

const keyToDate = (key) => {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

function parts(key, options) {
  const formatter = new Intl.DateTimeFormat(intlLocale(currentLocale()), { ...options, timeZone: "UTC" });
  const out = {};
  for (const part of formatter.formatToParts(keyToDate(key))) out[part.type] = part.value;
  return out;
}

export function formatDateKey(key, { year = true } = {}) {
  if (!key) return "";
  const p = parts(key, { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
  return [p.day, p.month, year ? p.year : null].filter(Boolean).join(" ");
}

export function formatBucket(key, granularity) {
  if (granularity === "month") {
    const p = parts(key, { month: "short", year: "numeric" });
    return `${p.month} ${p.year}`;
  }
  if (granularity === "week") return formatDateKey(key, { year: false });
  const p = parts(key, { weekday: "short", day: "numeric" });
  return `${p.weekday} ${p.day}`;
}

export function formatKeyRange(from, to) {
  if (!from) return "";
  if (from === to) return formatDateKey(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${formatDateKey(from, { year: !sameYear })} – ${formatDateKey(to)}`;
}

/** Percent change from `previous` to `current`; null when there is nothing to compare with. */
export function percentChange(current, previous) {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;
  if (before === 0) return now === 0 ? 0 : null;
  return ((now - before) / before) * 100;
}
