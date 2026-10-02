import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import { getDateRanges } from "../utils/dateHelpers.js";
import { DELIVERED_SUBTOTAL_EXPR } from "../utils/earnings.js";
import { toMoney } from "../utils/money.js";
import { normalizeCurrency } from "@chowgo/shared/currency";
import { lastDateKeys, resolveTimeZone, startOfDay } from "../utils/zonedTime.js";
import mongoose from "mongoose";

export async function validateRestaurantAccess(restaurantId, userId) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError("Invalid restaurant ID", 400);
  }

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  if (restaurant.ownerId.toString() !== userId.toString()) {
    throw new AppError("Unauthorized to access this restaurant's stats", 403);
  }

  return restaurant;
}

const ACTIVE_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "in_transit",
];

const inRange = (from, to) => ({
  $and: [{ $gte: ["$createdAt", from] }, ...(to ? [{ $lt: ["$createdAt", to] }] : [])],
});

const periodTotals = (from, to) => [
  { $match: { $expr: inRange(from, to) } },
  {
    $group: {
      _id: null,
      revenue: { $sum: DELIVERED_SUBTOTAL_EXPR },
      customers: { $addToSet: "$customer" },
    },
  },
  { $project: { _id: 0, revenue: 1, customers: { $size: "$customers" } } },
];

export async function fetchPeriodTotals(restaurantId, dateRanges) {
  const { startOfWeek, startOfMonth, startOfLastWeek, startOfLastMonth } = dateRanges;

  const [result] = await Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: new Date(Math.min(startOfLastMonth, startOfLastWeek)) },
        status: { $nin: ["cancelled", "rejected"] },
      },
    },
    {
      $facet: {
        month: periodTotals(startOfMonth),
        lastMonth: periodTotals(startOfLastMonth, startOfMonth),
        lastWeekActive: [
          {
            $match: {
              $expr: inRange(startOfLastWeek, startOfWeek),
              status: { $in: ACTIVE_STATUSES },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const empty = { revenue: 0, customers: 0 };
  const month = result?.month[0] ?? empty;
  const lastMonth = result?.lastMonth[0] ?? empty;

  return {
    revenue: toMoney(month.revenue),
    customers: month.customers,
    lastMonthRevenue: toMoney(lastMonth.revenue),
    lastMonthCustomers: lastMonth.customers,
    lastWeekActiveOrders: result?.lastWeekActive[0]?.count ?? 0,
  };
}

export async function fetchActiveOrders(restaurantId) {
  return Order.countDocuments({
    restaurant: restaurantId,
    status: { $in: ACTIVE_STATUSES },
  });
}

export async function fetchPopularItems(restaurantId, startOfMonth) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItem",
        name: { $first: "$items.name" },
        totalOrders: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
        price: { $first: "$items.price" },
      },
    },
    { $sort: { totalOrders: -1 } },
    { $limit: 4 },
  ]);
}

export async function fetchDailyRevenue(restaurantId, since, timeZone) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: since },
        status: { $nin: ["cancelled", "rejected"] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timeZone },
        },
        revenue: { $sum: DELIVERED_SUBTOTAL_EXPR },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function fetchRecentOrders(restaurantId) {
  return Order.find({
    restaurant: restaurantId,
    status: {
      $in: ["pending", "confirmed", "preparing", "ready"],
    },
  })
    .populate("customer", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
}

export function calculateRevenueTrend(currentRevenue, previousRevenue) {
  if (previousRevenue > 0) {
    return (
      ((currentRevenue - previousRevenue) / previousRevenue) *
      100
    ).toFixed(1);
  }
  return currentRevenue > 0 ? 100 : 0;
}

export function calculateOrdersTrend(currentCount, previousCount) {
  if (previousCount > 0) {
    return (((currentCount - previousCount) / previousCount) * 100).toFixed(1);
  }
  return currentCount > 0 ? 100 : 0;
}

export function calculateCustomersTrend(currentCount, previousCount) {
  if (previousCount > 0) {
    return (((currentCount - previousCount) / previousCount) * 100).toFixed(1);
  }
  return currentCount > 0 ? 100 : 0;
}

export function buildRevenueByDay(dailyData, timeZone) {
  return lastDateKeys(7, timeZone).map((date) => {
    const dayData = dailyData.find((d) => d._id === date);
    return {
      date,
      revenue: dayData ? toMoney(dayData.revenue) : 0,
      orders: dayData ? dayData.orders : 0,
    };
  });
}

export function buildChartData(revenueByDay) {
  const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1);
  return revenueByDay.map((d) => ({
    ...d,
    percentage: (d.revenue / maxRevenue) * 100,
  }));
}

const FALLBACK_DISH_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80";

export async function enrichPopularItemsWithImages(popularItems) {
  const menuItems = await MenuItem.find({ _id: { $in: popularItems.map((item) => item._id) } })
    .select("imageUrls")
    .lean();
  const images = new Map(menuItems.map((m) => [String(m._id), m.imageUrls?.[0]]));
  return popularItems.map((item) => ({
    name: item.name,
    totalOrders: item.totalOrders,
    totalRevenue: item.totalRevenue,
    price: item.price,
    image: images.get(String(item._id)) || FALLBACK_DISH_IMAGE,
  }));
}

export function formatRecentOrders(orders) {
  return orders.map((order) => ({
    _id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    items: order.items,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }));
}

export function buildStatsResponse(
  totals,
  activeOrders,
  restaurant,
  revenueTrend,
  ordersTrend,
  customersTrend,
  chartData,
  popularItemsWithImages,
  recentOrders,
) {
  return {
    success: true,
    stats: {
      totalRevenue: {
        value: totals.revenue.toFixed(2),
        trend: revenueTrend,
        isPositive: parseFloat(revenueTrend) >= 0,
      },
      activeOrders: {
        value: activeOrders,
        trend: ordersTrend,
        isPositive: parseFloat(ordersTrend) >= 0,
      },
      totalCustomers: {
        value: totals.customers,
        trend: customersTrend,
        isPositive: parseFloat(customersTrend) >= 0,
      },
      avgRating: {
        value: restaurant.averageRating?.toFixed(1) || "0.0",
        trend: "0",
        isPositive: true,
        totalReviews: restaurant.totalReviews || 0,
      },
    },
    chartData,
    popularItems: popularItemsWithImages,
    recentOrders: formatRecentOrders(recentOrders),
  };
}

export async function getRestaurantStats(restaurantId, userId) {
  const restaurant = await validateRestaurantAccess(restaurantId, userId);

  const dateRanges = getDateRanges();
  const timeZone = resolveTimeZone(restaurant.timezone);

  const [totals, activeOrders, popularItems, dailyRevenue, recentOrders] = await Promise.all([
    fetchPeriodTotals(restaurantId, dateRanges),
    fetchActiveOrders(restaurantId),
    fetchPopularItems(restaurantId, dateRanges.startOfMonth),
    fetchDailyRevenue(restaurantId, startOfDay(new Date(), timeZone, 6), timeZone),
    fetchRecentOrders(restaurantId),
  ]);

  const revenueTrend = calculateRevenueTrend(totals.revenue, totals.lastMonthRevenue);
  const ordersTrend = calculateOrdersTrend(activeOrders, totals.lastWeekActiveOrders);
  const customersTrend = calculateCustomersTrend(totals.customers, totals.lastMonthCustomers);

  const chartData = buildChartData(buildRevenueByDay(dailyRevenue, timeZone));
  const popularItemsWithImages = await enrichPopularItemsWithImages(popularItems);

  const response = buildStatsResponse(
    totals,
    activeOrders,
    restaurant,
    revenueTrend,
    ordersTrend,
    customersTrend,
    chartData,
    popularItemsWithImages,
    recentOrders,
  );
  return { ...response, currency: normalizeCurrency(restaurant.currency) };
}
