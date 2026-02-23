import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function fetchKpis(restaurantId, restaurant) {
  const [todayResult, monthlyResult] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
          status: "delivered",
          createdAt: { $gte: startOfToday() },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $count: {} },
          avgOrderValue: { $avg: "$total" },
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
          total: { $sum: "$total" },
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
    todayRevenue: today.totalRevenue,
    todayOrders: today.totalOrders,
    avgOrderValue: today.avgOrderValue,
    monthlyRevenue: monthlyResult[0]?.total ?? 0,
    averageRating: restaurant.averageRating,
    totalReviews: restaurant.totalReviews,
  };
}

async function fetchPeakHours(restaurantId) {
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
        _id: { $hour: "$createdAt" },
        orders: { $count: {} },
        revenue: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return Array.from({ length: 24 }, (_, hour) => {
    const found = raw.find((p) => p._id === hour);
    return {
      hour: `${hour}:00`,
      orders: found?.orders ?? 0,
      revenue: found?.revenue ?? 0,
    };
  });
}

async function fetchDailyRevenue(restaurantId) {
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
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $count: {} },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split("T")[0];
    const found = raw.find((d) => d._id === key);
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: found?.revenue ?? 0,
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

  const [
    kpis,
    peakHours,
    dailyRevenue,
    orderStatusBreakdown,
    paymentMethodSplit,
    topItems,
    recentRatings,
  ] = await Promise.all([
    fetchKpis(restaurantId, restaurant),
    fetchPeakHours(restaurantId),
    fetchDailyRevenue(restaurantId),
    fetchOrderStatusBreakdown(restaurantId),
    fetchPaymentMethodSplit(restaurantId),
    fetchTopItems(restaurantId),
    fetchRecentRatings(restaurantId),
  ]);

  return {
    kpis,
    peakHours,
    dailyRevenue,
    orderStatusBreakdown,
    paymentMethodSplit,
    topItems,
    recentRatings,
  };
}
