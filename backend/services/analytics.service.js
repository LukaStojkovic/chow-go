import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { DELIVERED_SUBTOTAL_EXPR } from "../utils/earnings.js";
import { toMoney } from "../utils/money.js";
import { normalizeCurrency } from "@chowgo/shared/currency";
import { lastDateKeys, resolveTimeZone, startOfDay } from "../utils/zonedTime.js";

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
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
          totalRevenue: { $sum: "$subtotal" },
          totalOrders: { $count: {} },
          avgOrderValue: { $avg: "$subtotal" },
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
          total: { $sum: "$subtotal" },
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

async function fetchPeakHours(restaurantId, timeZone) {
  const raw = await Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: { $nin: ["cancelled", "rejected"] },
        createdAt: { $gte: daysAgo(7) },
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
        status: { $nin: ["cancelled", "rejected"] },
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

async function fetchOrderStatusBreakdown(restaurantId) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: daysAgo(30) },
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

async function fetchPaymentMethodSplit(restaurantId) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: { $nin: ["cancelled", "rejected"] },
        createdAt: { $gte: daysAgo(30) },
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

async function fetchTopItems(restaurantId) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        status: { $nin: ["cancelled", "rejected"] },
        createdAt: { $gte: daysAgo(30) },
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
    { $limit: 5 },
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

export async function getRestaurantAnalytics(restaurantId, userId) {
  const restaurant = await Restaurant.findById(restaurantId).lean();

  if (!restaurant) throw new AppError("Restaurant not found", 404);
  if (restaurant.ownerId.toString() !== userId.toString())
    throw new AppError("Unauthorized", 403);
  const timeZone = resolveTimeZone(restaurant.timezone);

  const [
    kpis,
    peakHours,
    dailyRevenue,
    orderStatusBreakdown,
    paymentMethodSplit,
    topItems,
    recentRatings,
  ] = await Promise.all([
    fetchKpis(restaurantId, restaurant, timeZone),
    fetchPeakHours(restaurantId, timeZone),
    fetchDailyRevenue(restaurantId, timeZone),
    fetchOrderStatusBreakdown(restaurantId),
    fetchPaymentMethodSplit(restaurantId),
    fetchTopItems(restaurantId),
    fetchRecentRatings(restaurantId),
  ]);

  return {
    currency: normalizeCurrency(restaurant.currency),
    kpis,
    peakHours,
    dailyRevenue,
    orderStatusBreakdown,
    paymentMethodSplit,
    topItems,
    recentRatings,
  };
}
