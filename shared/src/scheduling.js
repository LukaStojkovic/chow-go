/**
 * Opening hours in a restaurant's own time zone, and the delivery slots a
 * customer can schedule an order for. The backend validates a chosen slot with
 * the same functions the clients build the picker from.
 */

export const DEFAULT_TIMEZONE = "Europe/Belgrade";

const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const SCHEDULING = {
  stepMinutes: 15,
  minLeadMinutes: 45,
  maxDaysAhead: 3,
  defaultPrepMinutes: 30,
  travelMinutes: 30,
};

const MINUTE = 60 * 1000;
const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function isWithinWindow(day, nowMinutes, spilloverOnly) {
  if (!day?.isOpen) return false;
  if (!TIME_PATTERN.test(day.openingTime ?? "") || !TIME_PATTERN.test(day.closingTime ?? "")) return false;

  const open = toMinutes(day.openingTime);
  const close = toMinutes(day.closingTime);

  if (open === close) return !spilloverOnly;
  if (close > open) return spilloverOnly ? false : nowMinutes >= open && nowMinutes < close;
  return spilloverOnly ? nowMinutes < close : nowMinutes >= open;
}

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
    const hours = Number(get("hour")) % 24;
    const minutes = Number(get("minute"));
    if (dayIndex === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) throw new Error("unparseable");
    return { dayIndex, minutes: hours * 60 + minutes };
  } catch {
    // An unusable zone must never close a restaurant; fall back to the host clock.
    return { dayIndex: date.getDay(), minutes: date.getHours() * 60 + date.getMinutes() };
  }
}

/**
 * Whether a weekly schedule is open at an instant, in the restaurant's zone.
 * Checks today's window and yesterday's overnight spill.
 */
export function isOpenAt(schedule, date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  if (!schedule) return false;
  const { dayIndex, minutes } = zonedNow(date, timeZone || DEFAULT_TIMEZONE);
  const yesterdayIndex = (dayIndex + 6) % 7;
  return (
    isWithinWindow(schedule[DAYS_OF_WEEK[dayIndex]], minutes, false) ||
    isWithinWindow(schedule[DAYS_OF_WEEK[yesterdayIndex]], minutes, true)
  );
}

/** Minutes before a delivery time that the kitchen has to start. */
export function kitchenLeadMinutes(prepMinutes) {
  const prep = Number(prepMinutes) > 0 ? Number(prepMinutes) : SCHEDULING.defaultPrepMinutes;
  return prep + SCHEDULING.travelMinutes;
}

/** When a scheduled order should reach the restaurant as a new order. */
export function releaseTimeFor(scheduledFor, prepMinutes) {
  return new Date(new Date(scheduledFor).getTime() - kitchenLeadMinutes(prepMinutes) * MINUTE);
}

const ceilToStep = (time) => {
  const step = SCHEDULING.stepMinutes * MINUTE;
  return Math.ceil(time / step) * step;
};

/**
 * Why a delivery time cannot be scheduled, or null when it can. The kitchen has
 * to be open when it would start cooking; the delivery itself may land after
 * closing.
 *
 * @param {{ schedule: Object, timeZone?: string, prepMinutes?: number }} restaurant
 * @param {Date | string | number} slot
 * @param {Date} [now]
 * @returns {null | "SCHEDULE_INVALID" | "SCHEDULE_TOO_SOON" | "SCHEDULE_TOO_FAR" | "SCHEDULE_CLOSED"}
 */
export function slotProblem({ schedule, timeZone, prepMinutes }, slot, now = new Date()) {
  const time = new Date(slot).getTime();
  if (!Number.isFinite(time) || time % (SCHEDULING.stepMinutes * MINUTE) !== 0) return "SCHEDULE_INVALID";
  if (time < now.getTime() + SCHEDULING.minLeadMinutes * MINUTE) return "SCHEDULE_TOO_SOON";
  if (time > now.getTime() + SCHEDULING.maxDaysAhead * 24 * 60 * MINUTE) return "SCHEDULE_TOO_FAR";
  if (!isOpenAt(schedule, releaseTimeFor(time, prepMinutes), timeZone)) return "SCHEDULE_CLOSED";
  return null;
}

/**
 * Every delivery time a customer can pick, earliest first, as Dates.
 *
 * @param {{ schedule: Object, timeZone?: string, prepMinutes?: number }} restaurant
 * @param {Date} [now]
 * @returns {Date[]}
 */
export function deliverySlots(restaurant, now = new Date()) {
  const slots = [];
  const first = ceilToStep(now.getTime() + SCHEDULING.minLeadMinutes * MINUTE);
  const last = now.getTime() + SCHEDULING.maxDaysAhead * 24 * 60 * MINUTE;
  for (let time = first; time <= last; time += SCHEDULING.stepMinutes * MINUTE) {
    if (!slotProblem(restaurant, time, now)) slots.push(new Date(time));
  }
  return slots;
}

/** The scheduling inputs a restaurant document or view carries. */
export function schedulingInputs(restaurant) {
  return {
    schedule: restaurant?.schedule,
    timeZone: restaurant?.timezone || DEFAULT_TIMEZONE,
    prepMinutes: restaurant?.estimatedPreparationTime,
  };
}
