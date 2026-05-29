import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import * as notificationService from "./orderNotification.service.js";
import * as socketService from "./orderSocket.service.js";

const COURIER_ACTIVE_STATUSES = ["assigned", "picked_up", "in_transit"];
const COURIER_HISTORY_STATUSES = ["delivered", "cancelled"];
const DEFAULT_RADIUS_METERS = 15_000;

function isOrderAvailableForCourier(order) {
  return (
    order &&
    order.status === "ready" &&
    !order.courier &&
    !order.cancelledAt &&
    !order.rejectedAt
  );
}

export async function getCourierByUserId(userId) {
  const courier = await Courier.findOne({ userId });
  if (!courier) throw new AppError("Courier profile not found", 404);
  return courier;
}

export async function listAvailableOrders({
  courierUserId,
  page = 1,
  limit = 20,
}) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const courier = await getCourierByUserId(courierUserId);

  const coords = courier.currentLocation?.coordinates;
  const hasLocation = Array.isArray(coords) && coords.length === 2;
  const [lng, lat] = hasLocation ? coords : [0, 0];
  if (hasLocation) {
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "deliveryDistance",
          maxDistance: DEFAULT_RADIUS_METERS,
          spherical: true,
          query: { status: "ready", courier: null },
          key: "deliveryAddressSnapshot.location",
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          orders: [
            { $skip: skip },
            { $limit: limitNum },
            {
              $lookup: {
                from: "restaurants",
                localField: "restaurant",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      profilePicture: 1,
                      address: 1,
                      phone: 1,
                      location: 1,
                    },
                  },
                ],
                as: "restaurant",
              },
            },
            {
              $unwind: {
                path: "$restaurant",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await Order.aggregate(pipeline);
    const orders = result.orders;
    const totalItems = result.total[0]?.count ?? 0;

    return {
      orders,
      geoFiltered: true,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        totalItems,
        limit: limitNum,
        hasNext: pageNum < Math.ceil(totalItems / limitNum),
        hasPrev: pageNum > 1,
      },
    };
  }

  const query = { status: "ready", courier: null };

  const [orders, totalItems] = await Promise.all([
    Order.find(query)
      .populate("restaurant", "name profilePicture address phone location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    geoFiltered: false,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
      limit: limitNum,
      hasNext: pageNum < Math.ceil(totalItems / limitNum),
      hasPrev: pageNum > 1,
    },
  };
}

export async function listCourierOrders({
  courierId,
  status,
  page = 1,
  limit = 20,
}) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const query = { courier: courierId };
  if (status === "active") query.status = { $in: COURIER_ACTIVE_STATUSES };
  else if (status === "history")
    query.status = { $in: COURIER_HISTORY_STATUSES };
  else if (status) query.status = status;

  const [orders, totalItems] = await Promise.all([
    Order.find(query)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone location")
      .populate("courier", "fullName phoneNumber vehicleType currentLocation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems,
      limit: limitNum,
      hasNext: pageNum < Math.ceil(totalItems / limitNum),
      hasPrev: pageNum > 1,
    },
  };
}

export async function acceptOrderOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);

  if (!courier.isAvailable) {
    throw new AppError("You must be on duty to accept orders", 400);
  }

  const existingActive = await Order.findOne({
    courier: courier._id,
    status: { $in: COURIER_ACTIVE_STATUSES },
  });
  if (existingActive) {
    throw new AppError("You already have an active order", 400);
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: "ready",
      courier: null,
      cancelledAt: null,
      rejectedAt: null,
    },
    {
      $set: {
        status: "assigned",
        assignedAt: new Date(),
        courier: courier._id,
      },
    },
    { new: true },
  );

  if (!order) {
    throw new AppError("Order is not available for assignment", 400);
  }

  courier.currentOrder = order._id;
  courier.isAvailable = false;
  await courier.save();

  await notificationService.createOrderStatusNotification(order, "assigned");
  await socketService.emitOrderAssigned(order);

  const populated = await Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");

  return populated;
}

export async function cancelAssignedOrderOperation({
  orderId,
  courierUserId,
  reason,
}) {
  const courier = await getCourierByUserId(courierUserId);

  const order = await Order.findOne({
    _id: orderId,
    courier: courier._id,
  });
  if (!order) throw new AppError("Order not found", 404);

  if (!["assigned"].includes(order.status)) {
    throw new AppError("Only assigned orders can be cancelled by courier", 400);
  }

  order.status = "ready";
  order.courier = null;
  order.assignedAt = null;
  order.courierNotes = reason || "";
  await order.save();

  courier.currentOrder = null;
  courier.isAvailable = true;
  await courier.save();

  await socketService.emitOrderCourierUnassigned(
    order,
    reason || "Cancelled by courier",
  );

  const populated = await Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");

  return populated;
}

export async function markPickedUpOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);
  const order = await Order.findOne({ _id: orderId, courier: courier._id });
  if (!order) throw new AppError("Order not found", 404);

  if (order.status !== "assigned") {
    throw new AppError("Order must be assigned to mark picked up", 400);
  }

  order.status = "picked_up";
  order.pickedUpAt = new Date();
  await order.save();

  await notificationService.createOrderStatusNotification(order, "picked_up");
  await socketService.emitOrderPickedUp(order);

  return await Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");
}

export async function markInTransitOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);
  const order = await Order.findOne({ _id: orderId, courier: courier._id });
  if (!order) throw new AppError("Order not found", 404);

  if (!["picked_up"].includes(order.status)) {
    throw new AppError("Order must be picked up to start delivery", 400);
  }

  order.status = "in_transit";
  await order.save();

  await notificationService.createOrderStatusNotification(order, "in_transit");
  await socketService.emitOrderInTransit(order);

  return await Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");
}

export async function markDeliveredOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);
  const order = await Order.findOne({ _id: orderId, courier: courier._id });
  if (!order) throw new AppError("Order not found", 404);

  if (!["in_transit"].includes(order.status)) {
    throw new AppError("Order must be in transit to deliver", 400);
  }

  order.status = "delivered";
  order.deliveredAt = new Date();
  await order.save();

  courier.currentOrder = null;
  courier.isAvailable = true;
  courier.totalDeliveries += 1;
  courier.successfulDeliveries += 1;
  await courier.save();

  await notificationService.createOrderStatusNotification(order, "delivered");
  await socketService.emitOrderDelivered(order);

  return await Order.findById(order._id)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");
}

export async function getCourierOrderById({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);

  const order = await Order.findOne({ _id: orderId, courier: courier._id })
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");

  if (!order) throw new AppError("Order not found", 404);
  return order;
}

export async function changeCourierDutyStatusOperation({
  courierUserId,
  isAvailable,
}) {
  const courier = await getCourierByUserId(courierUserId);

  if (isAvailable && courier.currentOrder) {
    throw new AppError("Cannot go on duty while having an active order", 400);
  }

  courier.isAvailable = isAvailable;
  await courier.save();

  return courier;
}

export async function getCourierAnalytics({ courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseMatch = {
    courier: courier._id,
    status: "delivered",
  };

  const [
    todayStats,
    weekStats,
    monthStats,
    weeklyEarnings,
    recentOrders,
    ratingStats,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { ...baseMatch, deliveredAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          earnings: { $sum: "$deliveryFee" },
          deliveries: { $sum: 1 },
          totalTime: {
            $sum: {
              $dateDiff: {
                startDate: "$assignedAt",
                endDate: "$deliveredAt",
                unit: "minute",
              },
            },
          },
        },
      },
    ]),

    Order.aggregate([
      { $match: { ...baseMatch, deliveredAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: null,
          earnings: { $sum: "$deliveryFee" },
          deliveries: { $sum: 1 },
        },
      },
    ]),

    Order.aggregate([
      { $match: { ...baseMatch, deliveredAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          earnings: { $sum: "$deliveryFee" },
          deliveries: { $sum: 1 },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          ...baseMatch,
          deliveredAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: {
            $dayOfWeek: "$deliveredAt",
          },
          earnings: { $sum: "$deliveryFee" },
          deliveries: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Order.find(baseMatch)
      .populate("restaurant", "name profilePicture address")
      .populate("customer", "name")
      .sort({ deliveredAt: -1 })
      .limit(5)
      .select("orderNumber total deliveryFee deliveredAt restaurant customer"),

    Order.aggregate([
      {
        $match: {
          courier: courier._id,
          "customerRating.courierRating": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$customerRating.courierRating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]),
  ]);

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const earningsMap = Object.fromEntries(
    weeklyEarnings.map((d) => [
      d._id - 1,
      { earnings: d.earnings, deliveries: d.deliveries },
    ]),
  );
  const chartData = DAY_NAMES.map((day, i) => ({
    day,
    earnings: earningsMap[i]?.earnings ?? 0,
    deliveries: earningsMap[i]?.deliveries ?? 0,
  }));

  const today = todayStats[0] ?? { earnings: 0, deliveries: 0, totalTime: 0 };
  const week = weekStats[0] ?? { earnings: 0, deliveries: 0 };
  const month = monthStats[0] ?? { earnings: 0, deliveries: 0 };
  const rating = ratingStats[0] ?? {
    avgRating: courier.averageRating,
    totalRatings: courier.totalRatings,
  };

  const acceptanceRate =
    courier.totalDeliveries > 0
      ? Math.round(
          (courier.successfulDeliveries / courier.totalDeliveries) * 100,
        )
      : 100;

  const avgDeliveryTime =
    today.deliveries > 0 ? Math.round(today.totalTime / today.deliveries) : 0;

  return {
    today: {
      earnings: today.earnings,
      deliveries: today.deliveries,
      avgDeliveryTime,
    },
    week: {
      earnings: week.earnings,
      deliveries: week.deliveries,
    },
    month: {
      earnings: month.earnings,
      deliveries: month.deliveries,
    },
    allTime: {
      totalDeliveries: courier.totalDeliveries,
      successfulDeliveries: courier.successfulDeliveries,
      cancelledDeliveries: courier.cancelledDeliveries,
      totalEarnings: courier.totalEarnings,
      averageRating: Math.round((rating.avgRating ?? 0) * 10) / 10,
      totalRatings: rating.totalRatings,
      acceptanceRate,
    },
    chartData,
    recentOrders,
  };
}
