import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import * as notificationService from "./orderNotification.service.js";
import * as socketService from "./orderSocket.service.js";
import { isUsableCoordinatePair, updateCourierLocation } from "./locationTracking.service.js";
import { parsePagination } from "../utils/pagination.js";

const COURIER_ACTIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

// The unclaimed pool is visible to every courier on duty, so it carries only
// what the accept decision needs. The entry details - door code, apartment,
// floor, entrance - and both note fields are withheld until the order is
// actually assigned, at which point listCourierOrders (scoped to the courier's
// own id) returns the full snapshot.
const POOL_ORDER_FIELDS = {
  orderNumber: 1,
  status: 1,
  restaurant: 1,
  items: 1,
  subtotal: 1,
  deliveryFee: 1,
  tip: 1,
  total: 1,
  paymentMethod: 1,
  createdAt: 1,
  readyAt: 1,
  estimatedDeliveryTime: 1,
  deliveryDistance: 1,
  "deliveryAddressSnapshot.fullAddress": 1,
  "deliveryAddressSnapshot.location": 1,
};
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

// The HTTP twin of the socket's courier:location_update, for the mobile
// background task: iOS suspends the socket shortly after the app leaves the
// foreground, and the OS runs the task in a context with no socket at all.
export async function reportCourierLocationOperation({ courierUserId, coordinates, orderId }) {
  const courier = await getCourierByUserId(courierUserId);
  const { shouldBroadcast, timestamp } = await updateCourierLocation({
    courierId: courier._id,
    coordinates,
  });

  const activeOrderId = orderId || courier.currentOrder;
  if (!activeOrderId) return { tracking: false };

  const order = await Order.findOne({
    _id: activeOrderId,
    courier: courier._id,
    status: { $in: COURIER_ACTIVE_STATUSES },
  })
    .select("customer restaurant")
    .lean();

  // No active delivery: the client should stop its background task.
  if (!order) return { tracking: false };

  if (shouldBroadcast) {
    socketService.emitCourierLocationUpdated({
      orderId: order._id,
      customerId: order.customer,
      restaurantId: order.restaurant,
      courierId: courier._id,
      coordinates,
      timestamp,
    });
  }
  return { tracking: true };
}

export async function getCourierByUserId(userId) {
  const courier = await Courier.findOne({ userId });
  if (!courier) throw new AppError("Courier profile not found", 404);
  return courier;
}

// About 220 m of latitude; less of longitude away from the equator.
const APPROXIMATE_GRID_DEGREES = 0.002;
const APPROXIMATE_DISTANCE_METERS = 500;

const roundTo = (value, step) => Math.round(value / step) * step;

// Anyone can sign up as a courier, and only accepting an order checks
// verification, so an unverified courier browsing the pool gets an area, not
// an address. The distance is rounded too: a courier controls their own
// reported position, and exact distances from a few positions pin the door.
function approximateForUnverified(order) {
  const doc = typeof order.toJSON === "function" ? order.toJSON() : order;
  const coords = doc.deliveryAddressSnapshot?.location?.coordinates;
  return {
    ...doc,
    deliveryAddressSnapshot: {
      approximate: true,
      location: isUsableCoordinatePair(coords)
        ? {
            type: "Point",
            coordinates: coords.map((c) => Number(roundTo(c, APPROXIMATE_GRID_DEGREES).toFixed(3))),
          }
        : undefined,
    },
    deliveryDistance:
      typeof doc.deliveryDistance === "number"
        ? Math.max(APPROXIMATE_DISTANCE_METERS, roundTo(doc.deliveryDistance, APPROXIMATE_DISTANCE_METERS))
        : undefined,
  };
}

export async function listAvailableOrders({ courierUserId, page, limit }) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

  const courier = await getCourierByUserId(courierUserId);
  const present =
    courier.verificationStatus === "verified"
      ? (orders) => orders
      : (orders) => orders.map(approximateForUnverified);

  const coords = courier.currentLocation?.coordinates;
  const hasLocation = isUsableCoordinatePair(coords);
  if (hasLocation) {
    const [lng, lat] = coords;
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
            { $project: POOL_ORDER_FIELDS },
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
    const orders = present(result.orders);
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

  const [found, totalItems] = await Promise.all([
    Order.find(query)
      .select(POOL_ORDER_FIELDS)
      .populate("restaurant", "name profilePicture address phone location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return {
    orders: present(found),
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
  page,
  limit,
}) {
  const { page: pageNum, limit: limitNum, skip } = parsePagination({ page, limit });

  const query = { courier: courierId };
  if (status === "active") query.status = { $in: COURIER_ACTIVE_STATUSES };
  else if (status === "history")
    query.status = { $in: COURIER_HISTORY_STATUSES };
  else if (status) query.status = status;

  const [orders, totalItems] = await Promise.all([
    Order.find(query)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone location")
      .populate("courier", "fullName phoneNumber vehicleType currentLocation lastLocationUpdate")
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


/**
 * Applies a courier-side status change only if the order is still in a status
 * that change is legal from, in one write. These were read, check, mutate,
 * save - the same shape the atomic claim below deliberately avoids.
 */
async function transition({ orderId, courierId, fromStatuses, set, conflictMessage }) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, courier: courierId, status: { $in: fromStatuses } },
    { $set: set },
    { new: true },
  );

  if (order) return order;

  const exists = await Order.exists({ _id: orderId, courier: courierId });
  if (!exists) throw new AppError("Order not found", 404);
  throw new AppError(conflictMessage, 409, "ORDER_STATUS_CONFLICT");
}

function populateOrder(orderId) {
  return Order.findById(orderId)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation lastLocationUpdate")
    .populate("items.menuItem", "name imageUrls");
}

export async function acceptOrderOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);

  // verificationStatus was written at signup and read nowhere, so anyone who
  // completed the courier form could take custody of a stranger's paid order
  // and their address. Approve a courier with scripts/verifyCourier.js until
  // there is an admin surface to do it from.
  if (courier.verificationStatus !== "verified") {
    throw new AppError(
      courier.verificationStatus === "rejected"
        ? "Your courier application was not approved."
        : "Your account is still being reviewed. You can accept orders once it is approved.",
      403,
      "COURIER_NOT_VERIFIED",
    );
  }

  if (!courier.isAvailable) {
    throw new AppError("You must be on duty to accept orders", 400);
  }

  // The courier is taken first, in one conditional write. Two accepts at once
  // used to both pass a separate "already busy?" read, claim two orders, and
  // leave one orphaned. Holding the courier before the order also means a
  // customer cancel that lands after the claim always finds them to release.
  const locked = await Courier.findOneAndUpdate(
    { _id: courier._id, isAvailable: true, currentOrder: null },
    { $set: { currentOrder: orderId, isAvailable: false } },
  );
  if (!locked) {
    throw new AppError("You already have an active order", 400, "COURIER_BUSY");
  }

  const release = () =>
    Courier.updateOne(
      { _id: courier._id, currentOrder: orderId },
      { $set: { currentOrder: null, isAvailable: true } },
    );

  let order;
  try {
    const existingActive = await Order.exists({
      courier: courier._id,
      status: { $in: COURIER_ACTIVE_STATUSES },
    });
    if (existingActive) {
      throw new AppError("You already have an active order", 400, "COURIER_BUSY");
    }

    order = await Order.findOneAndUpdate(
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
  } catch (err) {
    await release();
    throw err;
  }

  if (!order) {
    await release();
    throw new AppError("Order is not available for assignment", 400);
  }

  await notificationService.createOrderStatusNotification(order, "assigned");
  await socketService.emitOrderAssigned(order);

  await socketService.emitOrderTaken(order._id);

  const populated = await populateOrder(order._id);

  return populated;
}

export async function cancelAssignedOrderOperation({
  orderId,
  courierUserId,
  reason,
}) {
  const courier = await getCourierByUserId(courierUserId);

  const order = await transition({
    orderId,
    courierId: courier._id,
    fromStatuses: ["assigned"],
    set: { status: "ready", courier: null, assignedAt: null, courierNotes: reason || "" },
    conflictMessage: "Only an assigned order can be released",
  });

  await Courier.updateOne(
    { _id: courier._id },
    { $set: { currentOrder: null, isAvailable: true } },
  );

  await socketService.emitOrderCourierUnassigned(
    order,
    reason || "Cancelled by courier",
  );

  await socketService.emitOrderBackToPool(order);

  const populated = await populateOrder(order._id);

  return populated;
}

export async function markPickedUpOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);
  const order = await transition({
    orderId,
    courierId: courier._id,
    fromStatuses: ["assigned"],
    set: { status: "picked_up", pickedUpAt: new Date() },
    conflictMessage: "That order is no longer waiting to be picked up",
  });

  await notificationService.createOrderStatusNotification(order, "picked_up");
  await socketService.emitOrderPickedUp(order);

  return await populateOrder(order._id);
}

export async function markInTransitOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);
  const order = await transition({
    orderId,
    courierId: courier._id,
    fromStatuses: ["picked_up"],
    set: { status: "in_transit" },
    conflictMessage: "That order is not picked up yet",
  });

  await notificationService.createOrderStatusNotification(order, "in_transit");
  await socketService.emitOrderInTransit(order);

  return await populateOrder(order._id);
}

export async function markDeliveredOperation({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);
  const order = await transition({
    orderId,
    courierId: courier._id,
    fromStatuses: ["in_transit"],
    set: { status: "delivered", deliveredAt: new Date() },
    conflictMessage: "That order is not in transit",
  });

  // $inc rather than load-modify-save: the counters are shared with the
  // ratings path and two writes landing together lost one of them.
  await Courier.updateOne(
    { _id: courier._id },
    {
      $set: { currentOrder: null, isAvailable: true },
      $inc: { totalDeliveries: 1, successfulDeliveries: 1 },
    },
  );

  await notificationService.createOrderStatusNotification(order, "delivered");
  await socketService.emitOrderDelivered(order);

  return await populateOrder(order._id);
}

export async function getCourierOrderById({ orderId, courierUserId }) {
  const courier = await getCourierByUserId(courierUserId);

  const order = await Order.findOne({ _id: orderId, courier: courier._id })
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation lastLocationUpdate")
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
              $ifNull: [
                {
                  $dateDiff: {
                    startDate: { $ifNull: ["$pickedUpAt", "$assignedAt"] },
                    endDate: "$deliveredAt",
                    unit: "minute",
                  },
                },
                0,
              ],
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
