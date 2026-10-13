import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { DELIVERED_SUBTOTAL_EXPR, RESTAURANT_DISCOUNT_EXPR, RESTAURANT_EARNINGS_EXPR } from "../utils/earnings.js";
import { toMoney } from "../utils/money.js";
import { normalizeCurrency } from "@chowgo/shared/currency";
import { addDays } from "@chowgo/shared/dateKeys";
import { REPORT_LIMITS, bucketKeys, parseReportRange, previousRange } from "@chowgo/shared/reportRange";
import { dateKey, lastDateKeys, resolveTimeZone, startOfDateKey, startOfDay } from "../utils/zonedTime.js";

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const NOT_REFUSED = { $nin: ["cancelled", "rejected"] };

/** `[start, end)` instants for an inclusive range of local dates. */
export function rangeWindow(range, timeZone) {
  return { $gte: startOfDateKey(range.from, timeZone), $lt: startOfDateKey(addDays(range.to, 1), timeZone) };
}

/** Parses from/to/preset in the restaurant's zone, or throws a 400 the clients can explain. */
export function reportRangeFor(query, timeZone) {
  const parsed = parseReportRange(query, dateKey(new Date(), timeZone));
  if (parsed.error) {
    const tooLong = parsed.error.code === "REPORT_RANGE_TOO_LONG";
    throw new AppError(tooLong ? "errors:report.rangeTooLong" : "errors:report.rangeInvalid", 400, parsed.error.code, {
      max: REPORT_LIMITS.maxDays,
    });
  }
  return parsed.range;
}

async function fetchKpis(restaurantId, restaurant, timeZone) {
  const [todayResult, monthlyResult] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          status: "delivered",
          createdAt: { $gte: startOfDay(new Date(), timeZone) },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: RESTAURANT_EARNINGS_EXPR },
          totalOrders: { $count: {} },
          avgOrderValue: { $avg: RESTAURANT_EARNINGS_EXPR },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          status: "delivered",
          createdAt: { $gte: daysAgo(30) },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: RESTAURANT_EARNINGS_EXPR },
        },
      },
    ]),
  ]);

  const today = todayResult[0] ?? {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  };

  return {
    todayRevenue: toMoney(today.totalRevenue),
    todayOrders: today.totalOrders,
    avgOrderValue: toMoney(today.avgOrderValue ?? 0),
    monthlyRevenue: toMoney(monthlyResult[0]?.total ?? 0),
    averageRating: restaurant.averageRating,
    totalReviews: restaurant.totalReviews,
  };
}

async function fetchSummary(restaurantId, window) {
  const [row] = await Order.aggregate([
    { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId), createdAt: window } },
    {
      $group: {
        _id: null,
        revenue: { $sum: DELIVERED_SUBTOTAL_EXPR },
        delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        placed: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "rejected"]] }, 0, 1] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        discounts: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, RESTAURANT_DISCOUNT_EXPR, 0] } },
      },
    },
  ]);
  const delivered = row?.delivered ?? 0;
  return {
    revenue: toMoney(row?.revenue ?? 0),
    orders: delivered,
    avgOrderValue: toMoney(delivered ? row.revenue / delivered : 0),
    placed: row?.placed ?? 0,
    cancelled: row?.cancelled ?? 0,
    rejected: row?.rejected ?? 0,
    discounts: toMoney(row?.discounts ?? 0),
  };
}

function bucketExpr(granularity, timeZone) {
  const date =
    granularity === "day"
      ? "$createdAt"
      : { $dateTrunc: { date: "$createdAt", unit: granularity, timezone: timeZone, ...(granularity === "week" ? { startOfWeek: "monday" } : {}) } };
  return { $dateToString: { format: "%Y-%m-%d", date, timezone: timeZone } };
}

async function fetchSeries(restaurantId, range, window, timeZone) {
  const raw = await Order.aggregate([
    { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId), status: NOT_REFUSED, createdAt: window } },
    {
      $group: {
        _id: bucketExpr(range.granularity, timeZone),
        revenue: { $sum: DELIVERED_SUBTOTAL_EXPR },
        orders: { $count: {} },
      },
    },
  ]);
  const byKey = new Map(raw.map((r) => [r._id, r]));
  return bucketKeys(range).map((key) => ({
    key,
    revenue: toMoney(byKey.get(key)?.revenue ?? 0),
    orders: byKey.get(key)?.orders ?? 0,
  }));
}

async function fetchPeakHours(restaurantId, timeZone, window) {
  const raw = await Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: NOT_REFUSED,
        createdAt: window,
      },
    },
    {
      $group: {
        _id: { $hour: { date: "$createdAt", timezone: timeZone } },
        orders: { $count: {} },
        revenue: { $sum: DELIVERED_SUBTOTAL_EXPR },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return Array.from({ length: 24 }, (_, hour) => {
    const found = raw.find((p) => p._id === hour);
    return {
      hour: `${hour}:00`,
      orders: found?.orders ?? 0,
      revenue: toMoney(found?.revenue ?? 0),
    };
  });
}

async function fetchDailyRevenue(restaurantId, timeZone) {
  const raw = await Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: NOT_REFUSED,
        createdAt: { $gte: startOfDay(new Date(), timeZone, 6) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timeZone } },
        revenue: { $sum: DELIVERED_SUBTOTAL_EXPR },
        orders: { $count: {} },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return lastDateKeys(7, timeZone).map((key) => {
    const found = raw.find((d) => d._id === key);
    return {
      date: new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      revenue: toMoney(found?.revenue ?? 0),
      orders: found?.orders ?? 0,
    };
  });
}

async function fetchOrderStatusBreakdown(restaurantId, window) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: window,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $count: {} },
      },
    },
    { $sort: { count: -1 } },
  ]);
}

async function fetchPaymentMethodSplit(restaurantId, window) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: NOT_REFUSED,
        createdAt: window,
      },
    },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $count: {} },
        total: { $sum: "$total" },
      },
    },
  ]);
}

async function fetchTopItems(restaurantId, window) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: NOT_REFUSED,
        createdAt: window,
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItem",
        name: { $first: "$items.name" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);
}

async function fetchRecentRatings(restaurantId) {
  return Order.find({
    restaurant: restaurantId,
    "customerRating.restaurantRating": { $exists: true },
  })
    .sort({ "customerRating.ratedAt": -1 })
    .limit(5)
    .select("customerRating orderNumber createdAt")
    .populate("customer", "name profilePicture")
    .lean();
}

/**
 * The seller dashboard's analytics. Everything except the today/30-day KPIs, the last-7-days
 * chart and recent ratings covers the requested range (`from`/`to` local dates or a `preset`,
 * default the last 30 days); `summary.previous` is the same-length range before it.
 */
export async function getRestaurantAnalytics(restaurantId, userId, query = {}) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) throw new AppError("Restaurant not found", 404);
  const restaurant = await Restaurant.findById(restaurantId).lean();

  if (!restaurant) throw new AppError("Restaurant not found", 404);
  if (restaurant.ownerId.toString() !== userId.toString())
    throw new AppError("Unauthorized", 403);
  const timeZone = resolveTimeZone(restaurant.timezone);
  const range = reportRangeFor(query, timeZone);
  const window = rangeWindow(range, timeZone);
  const previous = previousRange(range);

  const [
    kpis,
    current,
    before,
    series,
    peakHours,
    dailyRevenue,
    orderStatusBreakdown,
    paymentMethodSplit,
    topItems,
    recentRatings,
  ] = await Promise.all([
    fetchKpis(restaurantId, restaurant, timeZone),
    fetchSummary(restaurantId, window),
    fetchSummary(restaurantId, rangeWindow(previous, timeZone)),
    fetchSeries(restaurantId, range, window, timeZone),
    fetchPeakHours(restaurantId, timeZone, window),
    fetchDailyRevenue(restaurantId, timeZone),
    fetchOrderStatusBreakdown(restaurantId, window),
    fetchPaymentMethodSplit(restaurantId, window),
    fetchTopItems(restaurantId, window),
    fetchRecentRatings(restaurantId),
  ]);

  return {
    currency: normalizeCurrency(restaurant.currency),
    timeZone,
    range,
    summary: { ...current, previous: { range: previous, ...before } },
    series,
    kpis,
    peakHours,
    dailyRevenue,
    orderStatusBreakdown,
    paymentMethodSplit,
    topItems,
    recentRatings,
  };
}
