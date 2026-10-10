/**
 * How the clients present scheduling: whether a closed restaurant takes
 * pre-orders, and slots grouped and labelled by day. The rules themselves are
 * in ./scheduling.js, which the backend validates with.
 */
import { formatTime } from "./format.js";
import { intlLocale } from "./i18n/config.js";
import { currentLocale, t } from "./i18n/index.js";
import { deliverySlots, schedulingInputs } from "./scheduling.js";

// The same test the backend applies before it accepts a pre-order.
const isLive = (raw) => Boolean(raw?.isActive) && (!raw.approvalStatus || raw.approvalStatus === "approved");

/** The delivery times a customer can pick for this restaurant document. */
export function slotsFor(raw, now = new Date()) {
  if (!isLive(raw)) return [];
  return deliverySlots(schedulingInputs(raw), new Date(now));
}

/** Closed now, but still taking orders for later. */
export function takesPreorders(raw, now = new Date()) {
  return Boolean(raw) && !raw.isOpenNow && slotsFor(raw, now).length > 0;
}

/** A calendar day on this device, for grouping slots. */
export function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** "Today", "Tomorrow", or "Saturday, 10 Oct" in the app language. */
export function dayLabel(value, now = new Date()) {
  const date = new Date(value);
  const offset = Math.round((startOfDay(date) - startOfDay(new Date(now))) / 86400000);
  if (offset === 0) return t("basket:schedule.today");
  if (offset === 1) return t("basket:schedule.tomorrow");
  return new Intl.DateTimeFormat(intlLocale(currentLocale()), { weekday: "long", day: "numeric", month: "short" }).format(
    date,
  );
}

/**
 * Slots grouped by day, in order: `[{ key, date, label, slots }]`.
 *
 * @param {Date[]} slots
 * @param {Date} [now]
 */
export function groupSlotsByDay(slots, now = new Date()) {
  const days = [];
  for (const slot of slots ?? []) {
    const key = dayKey(slot);
    const last = days[days.length - 1];
    if (last?.key === key) last.slots.push(slot);
    else days.push({ key, date: slot, label: dayLabel(slot, now), slots: [slot] });
  }
  return days;
}

/** "Tomorrow, 19:30" for a booked delivery time, or null. */
export function formatScheduledFor(value, now = new Date()) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return t("order:scheduled.at", { day: dayLabel(date, now), time: formatTime(date) });
}
