import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import { getDateRanges, getLast7Days } from "../utils/dateHelpers.js";
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

export async function fetchOrdersData(restaurantId, dateRanges) {
  const { startOfWeek, startOfMonth, startOfLastWeek, startOfLastMonth } =
    dateRanges;

  const [weekOrders, monthOrders, lastWeekOrders, lastMonthOrders] =
    await Promise.all([
      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfWeek },
        status: { $nin: ["cancelled", "rejected"] },
      }),
      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      }),
      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfLastWeek, $lt: startOfWeek },
        status: { $nin: ["cancelled", "rejected"] },
      }),
      Order.find({
        restaurant: restaurantId,
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
        status: { $nin: ["cancelled", "rejected"] },
      }),
    ]);

  return {
    weekOrders,
    monthOrders,
    lastWeekOrders,
    lastMonthOrders,
  };
}

export async function fetchActiveOrders(restaurantId) {
  return Order.countDocuments({
    restaurant: restaurantId,
    status: {
      $in: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "assigned",
        "picked_up",
        "in_transit",
      ],
    },
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

export async function fetchDailyRevenue(restaurantId, startOfWeek) {
  return Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: startOfWeek },
        status: { $nin: ["cancelled", "rejected"] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function fetchCustomerData(restaurantId, dateRanges) {
  const { startOfMonth, startOfLastMonth } = dateRanges;

  const [uniqueCustomers, lastMonthUniqueCustomers] = await Promise.all([
    Order.distinct("customer", {
      restaurant: restaurantId,
      createdAt: { $gte: startOfMonth },
      status: { $nin: ["cancelled", "rejected"] },
    }),
    Order.distinct("customer", {
      restaurant: restaurantId,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      status: { $nin: ["cancelled", "rejected"] },
    }),
  ]);

  return { uniqueCustomers, lastMonthUniqueCustomers };
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

export function buildRevenueByDay(dailyData) {
  const last7Days = getLast7Days();
  return last7Days.map((date) => {
    const dayData = dailyData.find((d) => d._id === date);
    return {
      date,
      revenue: dayData ? dayData.revenue : 0,
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

export async function enrichPopularItemsWithImages(popularItems) {
  return Promise.all(
    popularItems.map(async (item) => {
      const menuItem = await MenuItem.findById(item._id);
      return {
        name: item.name,
        totalOrders: item.totalOrders,
        totalRevenue: item.totalRevenue,
        price: item.price,
        image:
          menuItem?.imageUrls?.[0] ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80",
      };
    }),
  );
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
  totalRevenue,
  activeOrders,
  uniqueCustomers,
  restaurant,
  weekOrders,
  lastWeekOrders,
  revenueTrend,
  ordersTrend,
  customersTrend,
  chartData,
  popularItemsWithImages,
  recentOrders,
) {
  const lastWeekActiveOrders = lastWeekOrders.filter((order) =>
    [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "assigned",
      "picked_up",
      "in_transit",
    ].includes(order.status),
  ).length;

  return {
    success: true,
    stats: {
      totalRevenue: {
        value: totalRevenue.toFixed(2),
        trend: revenueTrend,
        isPositive: parseFloat(revenueTrend) >= 0,
      },
      activeOrders: {
        value: activeOrders,
        trend: ordersTrend,
        isPositive: parseFloat(ordersTrend) >= 0,
      },
      totalCustomers: {
        value: uniqueCustomers.length,
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

  const [
    ordersData,
    activeOrders,
    popularItems,
    dailyRevenue,
    customerData,
    recentOrders,
  ] = await Promise.all([
    fetchOrdersData(restaurantId, dateRanges),
    fetchActiveOrders(restaurantId),
    fetchPopularItems(restaurantId, dateRanges.startOfMonth),
    fetchDailyRevenue(restaurantId, dateRanges.startOfWeek),
    fetchCustomerData(restaurantId, dateRanges),
    fetchRecentOrders(restaurantId),
  ]);

  const { monthOrders, lastMonthOrders, weekOrders, lastWeekOrders } =
    ordersData;
  const { uniqueCustomers, lastMonthUniqueCustomers } = customerData;

  const totalRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
  const lastMonthRevenue = lastMonthOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  const lastWeekActiveOrders = lastWeekOrders.filter((order) =>
    [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "assigned",
      "picked_up",
      "in_transit",
    ].includes(order.status),
  ).length;

  const revenueTrend = calculateRevenueTrend(totalRevenue, lastMonthRevenue);
  const ordersTrend = calculateOrdersTrend(activeOrders, lastWeekActiveOrders);
  const customersTrend = calculateCustomersTrend(
    uniqueCustomers.length,
    lastMonthUniqueCustomers.length,
  );

  const revenueByDay = buildRevenueByDay(dailyRevenue);
  const chartData = buildChartData(revenueByDay);
  const popularItemsWithImages =
    await enrichPopularItemsWithImages(popularItems);

  return buildStatsResponse(
    totalRevenue,
    activeOrders,
    uniqueCustomers,
    restaurant,
    weekOrders,
    lastWeekOrders,
    revenueTrend,
    ordersTrend,
    customersTrend,
    chartData,
    popularItemsWithImages,
    recentOrders,
  );
}
