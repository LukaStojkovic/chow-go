export const DEFAULT_OPENING_TIME = "09:00";
export const DEFAULT_CLOSING_TIME = "22:00";

export const WEEK_DAYS = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
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

export function formatTime12h(time) {
  if (!time || typeof time !== "string" || !time.includes(":")) return "--";

  const [rawHours, minutes] = time.split(":");
  const hours = parseInt(rawHours, 10);

  if (Number.isNaN(hours)) return "--";

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${period}`;
}

export function formatDayHours(entry) {
  if (!entry?.isOpen) return "Closed";

  if (entry.openingTime === entry.closingTime) return "Open 24 hours";

  return `${formatTime12h(entry.openingTime)} – ${formatTime12h(entry.closingTime)}`;
}

export function isOvernight(entry) {
  if (!entry?.isOpen) return false;
  if (!entry.openingTime || !entry.closingTime) return false;
  if (entry.openingTime === entry.closingTime) return false;

  return entry.closingTime < entry.openingTime;
}
