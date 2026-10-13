import mongoose from "mongoose";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Payout from "../models/Payout.js";
import AuditLog from "../models/AuditLog.js";
import { AppError } from "../utils/AppError.js";
import { toCsv } from "../utils/csv.js";
import { toMoney } from "../utils/money.js";
import { RESTAURANT_DISCOUNT_EXPR, RESTAURANT_EARNINGS_EXPR, restaurantEarningsOf } from "../utils/earnings.js";
import { dateKey, resolveTimeZone, startOfDateKey } from "../utils/zonedTime.js";
import { DEFAULT_TIMEZONE, isOpenAt } from "../utils/schedule.js";
import { parsePagination } from "../utils/pagination.js";
import { rangeWindow, reportRangeFor } from "./analytics.service.js";
import { addDays, daysBetween, isDateKey, isoWeekday, weekStartKey } from "@chowgo/shared/dateKeys";
import { normalizeCurrency } from "@chowgo/shared/currency";
import { optionsSummary } from "@chowgo/shared/menuOptions";
import { normalizeClosures } from "@chowgo/shared/scheduling";
import { tFor } from "@chowgo/shared/i18n";

const MAX_ROWS = 20_000;
const WEEKS_PER_PAGE = 12;
const ADMIN_WEEKS = 12;

async function ownRestaurant(userId, select = "") {
  const restaurant = await Restaurant.findOne({ ownerId: userId }).select(`name timezone currency ${select}`).lean();
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  return restaurant;
}

function localDateTime(date, timeZone) {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(date));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

const COLUMNS = [
  "orderNumber", "placedAt", "status", "deliveredAt", "items", "itemCount", "subtotal", "restaurantDiscount",
  "earnings", "paymentMethod", "promoCode", "rating", "currency",
];

function ordersCsv(orders, timeZone, locale) {
  const header = COLUMNS.map((c) => tFor(locale, `seller:reports.csv.${c}`));
  const rows = orders.map((order) => {
    const delivered = order.status === "delivered";
    const discount = order.promo?.fundedBy === "restaurant" ? order.discount ?? 0 : 0;
    return [
      order.orderNumber,
      localDateTime(order.createdAt, timeZone),
      order.status,
      localDateTime(order.deliveredAt, timeZone),
      order.items
        .map((item) => {
          const options = optionsSummary(item.options);
          return `${item.quantity}x ${item.name}${options ? ` (${options})` : ""}`;
        })
        .join("; "),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      toMoney(order.subtotal ?? 0),
      toMoney(discount),
      delivered ? restaurantEarningsOf(order) : 0,
      order.paymentMethod,
      order.promo?.code ?? "",
      order.customerRating?.restaurantRating ?? "",
      normalizeCurrency(order.currency),
    ];
  });
  return toCsv(header, rows);
}

const CSV_FIELDS = "orderNumber createdAt status deliveredAt items subtotal discount promo paymentMethod customerRating.restaurantRating currency";

async function findForCsv(filter) {
  const count = await Order.countDocuments(filter);
  if (count > MAX_ROWS) throw new AppError("errors:report.tooManyRows", 400, "REPORT_TOO_MANY_ROWS", { max: MAX_ROWS });
  return Order.find(filter).sort({ createdAt: 1 }).select(CSV_FIELDS).lean();
}

/** Every order placed in a range, as CSV in the seller's language. */
export async function exportOrdersCsv(userId, query, locale) {
  const restaurant = await ownRestaurant(userId);
  const timeZone = resolveTimeZone(restaurant.timezone);
  const range = reportRangeFor(query, timeZone);
  const orders = await findForCsv({ restaurant: restaurant._id, createdAt: rangeWindow(range, timeZone) });
  return { filename: `orders_${range.from}_${range.to}.csv`, body: ordersCsv(orders, timeZone, locale) };
}

function weekBucket(timeZone) {
  return {
    $dateToString: {
      format: "%Y-%m-%d",
      date: { $dateTrunc: { date: "$deliveredAt", unit: "week", startOfWeek: "monday", timezone: timeZone } },
      timezone: timeZone,
    },
  };
}

async function weeklyTotals(match, timeZone, groupByRestaurant = false) {
  const rows = await Order.aggregate([
    { $match: { ...match, status: "delivered" } },
    {
      $group: {
        _id: groupByRestaurant ? { restaurant: "$restaurant", week: weekBucket(timeZone) } : weekBucket(timeZone),
        orders: { $count: {} },
        gross: { $sum: { $ifNull: ["$subtotal", 0] } },
        discounts: { $sum: RESTAURANT_DISCOUNT_EXPR },
        net: { $sum: RESTAURANT_EARNINGS_EXPR },
        currency: { $first: "$currency" },
      },
    },
  ]);
  return rows.map((r) => ({
    ...(groupByRestaurant ? { restaurant: r._id.restaurant, weekStart: r._id.week } : { weekStart: r._id }),
    orders: r.orders,
    gross: toMoney(r.gross),
    discounts: toMoney(r.discounts),
    net: toMoney(r.net),
    currency: normalizeCurrency(r.currency),
  }));
}

const weekWindow = (weekStart, timeZone, weeks = 1) => ({
  $gte: startOfDateKey(weekStart, timeZone),
  $lt: startOfDateKey(addDays(weekStart, 7 * weeks), timeZone),
});

function paidView(payout) {
  return payout
    ? { paidAt: payout.paidAt, reference: payout.reference, note: payout.note, amount: payout.net, id: String(payout._id) }
    : null;
}

/**
 * Weekly statements, newest first, 12 weeks a page: what the restaurant earned from orders delivered
 * Monday to Sunday, and whether the platform has paid it. The running week is "open".
 */
export async function listPayouts(userId, query = {}) {
  const restaurant = await ownRestaurant(userId);
  const timeZone = resolveTimeZone(restaurant.timezone);
  const currentWeek = weekStartKey(dateKey(new Date(), timeZone));
  const { page } = parsePagination(query, { defaultLimit: WEEKS_PER_PAGE });
  const newest = addDays(currentWeek, -7 * WEEKS_PER_PAGE * (page - 1));
  const oldest = addDays(newest, -7 * (WEEKS_PER_PAGE - 1));

  const [totals, payouts, older, dueRows] = await Promise.all([
    weeklyTotals({ restaurant: restaurant._id, deliveredAt: weekWindow(oldest, timeZone, WEEKS_PER_PAGE) }, timeZone),
    Payout.find({ restaurant: restaurant._id }).lean(),
    Order.exists({ restaurant: restaurant._id, status: "delivered", deliveredAt: { $lt: startOfDateKey(oldest, timeZone) } }),
    weeklyTotals({ restaurant: restaurant._id, deliveredAt: { $lt: startOfDateKey(currentWeek, timeZone) } }, timeZone),
  ]);
  const paidByWeek = new Map(payouts.map((p) => [p.weekStart, p]));
  const byWeek = new Map(totals.map((t) => [t.weekStart, t]));
  const currency = normalizeCurrency(restaurant.currency);

  const weeks = [];
  for (let week = newest; daysBetween(oldest, week) >= 0; week = addDays(week, -7)) {
    const totalsForWeek = byWeek.get(week);
    const payout = paidByWeek.get(week);
    if (!totalsForWeek && !payout) continue;
    const net = totalsForWeek?.net ?? 0;
    weeks.push({
      weekStart: week,
      weekEnd: addDays(week, 6),
      orders: totalsForWeek?.orders ?? 0,
      gross: totalsForWeek?.gross ?? 0,
      discounts: totalsForWeek?.discounts ?? 0,
      net,
      currency: totalsForWeek?.currency ?? currency,
      status: week === currentWeek ? "open" : payout ? "paid" : net > 0 ? "due" : "nothing",
      payout: paidView(payout),
      adjusted: Boolean(payout && toMoney(payout.net) !== net),
    });
  }

  const due = dueRows.filter((w) => !paidByWeek.has(w.weekStart) && w.net > 0);
  const lastPaid = payouts.sort((a, b) => b.paidAt - a.paidAt)[0];
  return {
    currency,
    timeZone,
    weeks,
    summary: {
      dueTotal: toMoney(due.reduce((sum, w) => sum + w.net, 0)),
      dueWeeks: due.length,
      openWeek: byWeek.get(currentWeek)?.net ?? 0,
      lastPaid: lastPaid ? { weekStart: lastPaid.weekStart, ...paidView(lastPaid) } : null,
    },
    pagination: { page, hasNext: Boolean(older) },
  };
}

function assertWeekStart(weekStart) {
  if (!isDateKey(weekStart) || isoWeekday(weekStart) !== 0) {
    throw new AppError("errors:payout.invalidWeek", 400, "PAYOUT_INVALID_WEEK");
  }
}

/** The delivered orders behind one weekly statement, as CSV. */
export async function payoutOrdersCsv(userId, weekStart, locale) {
  assertWeekStart(weekStart);
  const restaurant = await ownRestaurant(userId);
  const timeZone = resolveTimeZone(restaurant.timezone);
  const orders = await findForCsv({ restaurant: restaurant._id, status: "delivered", deliveredAt: weekWindow(weekStart, timeZone) });
  return { filename: `statement_${weekStart}.csv`, body: ordersCsv(orders, timeZone, locale) };
}

export async function getClosures(userId) {
  const restaurant = await ownRestaurant(userId, "closures schedule");
  const timeZone = resolveTimeZone(restaurant.timezone);
  const today = dateKey(new Date(), timeZone);
  return { closures: (restaurant.closures ?? []).filter((c) => daysBetween(today, c.to) >= 0), timeZone, today };
}

/** Replaces the restaurant's closures; past ones are dropped. Takes effect at once. */
export async function setClosures(userId, input) {
  const restaurant = await ownRestaurant(userId, "closures schedule isActive");
  const timeZone = resolveTimeZone(restaurant.timezone);
  const today = dateKey(new Date(), timeZone);
  const result = normalizeClosures(input, today);
  if (result.error) {
    const { code, ...params } = result.error;
    throw new AppError(`errors:closure.${code.replace("CLOSURE_", "").toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())}`, 400, code, params, params);
  }
  const isOpenNow = Boolean(restaurant.isActive) && isOpenAt(restaurant.schedule, new Date(), timeZone, result.closures);
  await Restaurant.updateOne({ _id: restaurant._id }, { $set: { closures: result.closures, isOpenNow } });
  return { closures: result.closures, timeZone, today, isOpenNow };
}

async function audit(actor, { action, targetId, reason = "", before, after, requestId }) {
  await AuditLog.create({ actor: actor._id, actorEmail: actor.email, action, targetType: "payout", targetId, reason, before, after, requestId });
}

/**
 * Finished weeks with money owed, across restaurants, oldest first (`status=paid` lists recorded
 * payouts instead). Grouped per time zone, since a week is local to each restaurant.
 */
export async function listAdminPayouts(query = {}) {
  if (query.status === "paid") {
    const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
    const [payouts, total] = await Promise.all([
      Payout.find().sort({ paidAt: -1 }).skip(skip).limit(limit).populate("restaurant", "name").lean(),
      Payout.countDocuments(),
    ]);
    return {
      payouts: payouts.map((p) => ({ ...p, id: String(p._id), restaurant: { id: String(p.restaurant?._id ?? p.restaurant), name: p.restaurant?.name ?? null } })),
      pagination: { page, limit, total, hasNext: skip + payouts.length < total },
    };
  }

  const since = new Date(Date.now() - (ADMIN_WEEKS + 1) * 7 * 24 * 60 * 60 * 1000);
  const restaurantIds = await Order.distinct("restaurant", { status: "delivered", deliveredAt: { $gte: since } });
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } }).select("name timezone currency").lean();
  const zones = new Map();
  for (const r of restaurants) {
    const zone = resolveTimeZone(r.timezone);
    zones.set(zone, [...(zones.get(zone) ?? []), r]);
  }

  const rows = [];
  for (const [zone, group] of zones) {
    const currentWeek = weekStartKey(dateKey(new Date(), zone));
    const oldest = addDays(currentWeek, -7 * ADMIN_WEEKS);
    const totals = await weeklyTotals(
      { restaurant: { $in: group.map((r) => r._id) }, deliveredAt: weekWindow(oldest, zone, ADMIN_WEEKS) },
      zone,
      true,
    );
    rows.push(...totals);
  }
  const paid = await Payout.find({ restaurant: { $in: restaurantIds } }).select("restaurant weekStart").lean();
  const paidKeys = new Set(paid.map((p) => `${p.restaurant}:${p.weekStart}`));
  const names = new Map(restaurants.map((r) => [String(r._id), r.name]));

  const due = rows
    .filter((r) => r.net > 0 && !paidKeys.has(`${r.restaurant}:${r.weekStart}`))
    .map((r) => ({ ...r, restaurant: { id: String(r.restaurant), name: names.get(String(r.restaurant)) ?? null }, weekEnd: addDays(r.weekStart, 6) }))
    .sort((a, b) => daysBetween(b.weekStart, a.weekStart) || String(a.restaurant.name).localeCompare(String(b.restaurant.name)));
  return { due, weeks: ADMIN_WEEKS };
}

/** Records that a finished week was paid, snapshotting the statement. */
export async function markPayoutPaid({ actor, input = {}, requestId }) {
  const { restaurantId, weekStart } = input;
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) throw new AppError("errors:restaurant.notFound", 404);
  assertWeekStart(weekStart);
  const reference = typeof input.reference === "string" ? input.reference.trim() : "";
  if (!reference || reference.length > 80) throw new AppError("errors:payout.reference", 400, "PAYOUT_REFERENCE");
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 300) : "";

  const restaurant = await Restaurant.findById(restaurantId).select("name timezone currency").lean();
  if (!restaurant) throw new AppError("errors:restaurant.notFound", 404);
  const timeZone = resolveTimeZone(restaurant.timezone ?? DEFAULT_TIMEZONE);
  if (daysBetween(addDays(weekStart, 7), dateKey(new Date(), timeZone)) < 0) {
    throw new AppError("errors:payout.weekOpen", 409, "PAYOUT_WEEK_OPEN");
  }
  const [statement] = await weeklyTotals({ restaurant: restaurant._id, deliveredAt: weekWindow(weekStart, timeZone) }, timeZone);
  if (!statement || statement.net <= 0) throw new AppError("errors:payout.nothingDue", 409, "PAYOUT_NOTHING_DUE");

  let payout;
  try {
    payout = await Payout.create({
      restaurant: restaurant._id, weekStart, weekEnd: addDays(weekStart, 6), currency: statement.currency, orders: statement.orders,
      gross: statement.gross, discounts: statement.discounts, net: statement.net, reference, note, paidAt: new Date(), paidBy: actor._id,
    });
  } catch (error) {
    if (error?.code === 11000) throw new AppError("errors:payout.alreadyPaid", 409, "PAYOUT_ALREADY_PAID");
    throw error;
  }
  const after = payout.toObject();
  await audit(actor, { action: "payout.paid", targetId: payout._id, after, requestId });
  return { ...after, id: String(payout._id), restaurant: { id: String(restaurant._id), name: restaurant.name } };
}

/** Removes a payout recorded by mistake; the week becomes due again. */
export async function voidPayout({ actor, payoutId, reason, requestId }) {
  if (!mongoose.Types.ObjectId.isValid(payoutId)) throw new AppError("errors:payout.notFound", 404, "PAYOUT_NOT_FOUND");
  const text = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  if (!text) throw new AppError("A reason is required", 400, "REASON_REQUIRED");
  const before = await Payout.findOneAndDelete({ _id: payoutId }).lean();
  if (!before) throw new AppError("errors:payout.notFound", 404, "PAYOUT_NOT_FOUND");
  await audit(actor, { action: "payout.void", targetId: before._id, reason: text, before, requestId });
  return { id: String(before._id), weekStart: before.weekStart };
}
