import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import { computeIsOpenNow } from "../utils/restaurantAvailability.js";
import { dateKey, resolveTimeZone, startOfDateKey } from "../utils/zonedTime.js";
import { emitRestaurantStatus } from "./orderSocket.service.js";
import { addDays } from "@chowgo/shared/dateKeys";
import { activeClosure, isOpenAt } from "@chowgo/shared/scheduling";
import { STATUS_LIMITS, busyState, pauseState } from "@chowgo/shared/restaurantStatus";

const FIELDS = "name isActive isOpenNow schedule timezone closures pause busy estimatedDeliveryTime";
const MINUTE = 60 * 1000;

async function ownRestaurant(userId) {
  const restaurant = await Restaurant.findOne({ ownerId: userId }).select(FIELDS).lean();
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  return restaurant;
}

/** What the seller's status control shows: the effective state, not the raw fields. */
export function statusView(restaurant, now = new Date()) {
  const timeZone = resolveTimeZone(restaurant.timezone);
  const pause = pauseState(restaurant, now);
  const busy = busyState(restaurant, now);
  return {
    isActive: Boolean(restaurant.isActive),
    isOpenNow: computeIsOpenNow(restaurant, now),
    scheduleOpen: isOpenAt(restaurant.schedule, now, timeZone, restaurant.closures),
    closure: activeClosure(restaurant.closures, now, timeZone),
    pause: pause ? { until: pause.until, indefinite: pause.indefinite, reason: pause.reason, since: restaurant.pause?.since ?? null } : null,
    busy: busy ? { extraMinutes: busy.extraMinutes, until: busy.until, since: restaurant.busy?.since ?? null } : null,
    timeZone,
  };
}

export async function getStatus(userId) {
  return statusView(await ownRestaurant(userId));
}

const invalid = (field) => new AppError("errors:restaurantStatus.invalid", 400, "STATUS_ACTION_INVALID", { field }, { field });

function intIn(value, { min, max }, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw invalid(field);
  return n;
}

function changesFor(input, restaurant, now) {
  switch (input?.action) {
    case "pause": {
      const reason = typeof input.reason === "string" ? input.reason.replace(/\s+/g, " ").trim() : "";
      if (reason.length > STATUS_LIMITS.reasonLength) throw invalid("reason");
      let until = null;
      let indefinite = false;
      if (input.until === "indefinite") indefinite = true;
      else if (input.until === "endOfDay") {
        const timeZone = resolveTimeZone(restaurant.timezone);
        until = startOfDateKey(addDays(dateKey(now, timeZone), 1), timeZone);
      } else until = new Date(now.getTime() + intIn(input.minutes, STATUS_LIMITS.pauseMinutes, "minutes") * MINUTE);
      return { $set: { pause: { until, indefinite, reason, since: now } } };
    }
    case "resume":
      return { $set: { pause: { until: null, indefinite: false, reason: "", since: null } } };
    case "busy": {
      const extraMinutes = intIn(input.extraMinutes, STATUS_LIMITS.busyExtra, "extraMinutes");
      const minutes = intIn(input.minutes, STATUS_LIMITS.busyMinutes, "minutes");
      return { $set: { busy: { extraMinutes, until: new Date(now.getTime() + minutes * MINUTE), since: now } } };
    }
    case "normal":
      return { $set: { busy: { extraMinutes: 0, until: null, since: null } } };
    default:
      throw invalid("action");
  }
}

/**
 * Applies one status action: `pause` ({minutes} | {until: "endOfDay" | "indefinite"}, optional
 * reason), `resume`, `busy` ({extraMinutes, minutes}) or `normal`. `isOpenNow` is recomputed in
 * the same write, so a pause stops new orders at once; the cron lifts expired ones.
 */
export async function applyStatusAction(userId, input = {}) {
  const restaurant = await ownRestaurant(userId);
  const now = new Date();
  const update = changesFor(input, restaurant, now);
  const next = { ...restaurant, ...update.$set };
  update.$set.isOpenNow = computeIsOpenNow(next, now);

  const updated = await Restaurant.findOneAndUpdate({ _id: restaurant._id }, update, { new: true }).select(FIELDS).lean();
  const view = statusView(updated, now);
  emitRestaurantStatus(updated._id, view);
  return view;
}
