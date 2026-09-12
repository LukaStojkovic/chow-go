import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import * as orderStatus from "../utils/orderStatus.js";
import * as notificationService from "./orderNotification.service.js";
import * as socketService from "./orderSocket.service.js";


/**
 * Applies a status change only if the order is still in a status the change is
 * legal from, in one write.
 *
 * These were all read, check, mutate, save - so two seller tabs could both
 * pass the guard and both write, and a seller's cancel could race a courier's
 * claim. The courier claim at courierOrder.service.js:190 was already the one
 * race-safe write in the codebase; this is the same shape.
 *
 * The extra read on failure is only to tell "not your order" apart from
 * "wrong status", which the caller needs for a sensible message.
 */
async function transition({ orderId, restaurantId, fromStatuses, set, conflictMessage }) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, restaurant: restaurantId, status: { $in: fromStatuses } },
    { $set: set },
    { new: true },
  );

  if (order) return order;

  const exists = await Order.exists({ _id: orderId, restaurant: restaurantId });
  if (!exists) throw new AppError("Order not found", 404);
  throw new AppError(conflictMessage, 409, "ORDER_STATUS_CONFLICT");
}

export async function getRestaurantByUserId(userId) {
  const restaurant = await Restaurant.findOne({ ownerId: userId });

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return restaurant;
}

export async function getOrdersByRestaurant({
  restaurantId,
  statusFilter,
  page = 1,
  limit = 20,
  search,
}) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const query = { restaurant: restaurantId };

  if (statusFilter) {
    const parsedStatus = orderStatus.parseStatusFilter(statusFilter);
    if (parsedStatus) {
      query.status = parsedStatus;
    }
  }

  if (search) {
    query.$or = [{ orderNumber: { $regex: search, $options: "i" } }];
  }

  const [orders, totalItems, statusCounts] = await Promise.all([
    Order.find(query)
      .populate("customer", "name phoneNumber email")
      .populate(
        "courier",
        "fullName phoneNumber vehicleType currentLocation lastLocationUpdate",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query),
    Order.aggregate([
      { $match: { restaurant: restaurantId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = {
    total: totalItems,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  };

  statusCounts.forEach((item) => {
    if (counts.hasOwnProperty(item._id)) {
      counts[item._id] = item.count;
    }
  });

  counts.active =
    (counts.pending || 0) +
    (counts.confirmed || 0) +
    (counts.preparing || 0) +
    (counts.ready || 0);

  return {
    orders,
    counts,
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

export async function getOrderById(orderId, restaurantId) {
  const order = await Order.findOne({
    _id: orderId,
    restaurant: restaurantId,
  })
    .populate("customer", "name email phoneNumber")
    .populate(
      "courier",
      "fullName phoneNumber vehicleType currentLocation lastLocationUpdate",
    )
    .populate("items.menuItem", "name imageUrls");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
}

export async function confirmOrderOperation(
  orderId,
  restaurantId,
  estimatedPreparationTime,
) {
  const prepTime = Number(estimatedPreparationTime) > 0 ? Number(estimatedPreparationTime) : 30;

  const order = await transition({
    orderId,
    restaurantId,
    fromStatuses: ["pending"],
    set: {
      status: "confirmed",
      confirmedAt: new Date(),
      estimatedPreparationTime: prepTime,
      estimatedDeliveryTime: new Date(Date.now() + prepTime * 60 * 1000 + 30 * 60 * 1000),
    },
    conflictMessage: "That order is no longer pending",
  });

  await notificationService.createOrderConfirmedNotification(order);

  await socketService.emitOrderConfirmed(order.customer, order, prepTime);

  return order;
}

export async function rejectOrderOperation(orderId, restaurantId, reason) {
  const order = await transition({
    orderId,
    restaurantId,
    fromStatuses: ["pending"],
    set: {
      status: "rejected",
      rejectedAt: new Date(),
      rejectionReason: reason || "Rejected by restaurant",
    },
    conflictMessage: "That order is no longer pending",
  });

  await notificationService.createOrderRejectedNotification(
    order,
    order.rejectionReason,
  );

  await socketService.emitOrderRejected(
    order.customer,
    order,
    order.rejectionReason,
  );

  return order;
}

export async function updateOrderStatusOperation(
  orderId,
  restaurantId,
  newStatus,
) {
  const fromStatuses = orderStatus.statusesThatReach(newStatus);
  if (fromStatuses.length === 0) {
    throw new AppError("Invalid status transition", 400, "INVALID_TRANSITION");
  }

  const order = await transition({
    orderId,
    restaurantId,
    fromStatuses,
    set: {
      status: newStatus,
      ...(newStatus === "preparing" ? { preparingAt: new Date() } : {}),
      ...(newStatus === "ready" ? { readyAt: new Date() } : {}),
    },
    conflictMessage: `That order cannot move to ${newStatus} from its current status`,
  });

  await notificationService.createOrderStatusNotification(order, newStatus);

  await socketService.emitOrderStatusChanged(order.customer, order, newStatus);

  if (newStatus === "ready") {
    await socketService.emitNewOrderAvailable(order);
  }

  return order;
}

export async function cancelOrderOperation(orderId, restaurantId, reason) {
  const order = await transition({
    orderId,
    restaurantId,
    fromStatuses: orderStatus.RESTAURANT_CANCELLABLE,
    set: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason || "Cancelled by restaurant",
      cancelledBy: "restaurant",
    },
    conflictMessage: "That order can no longer be cancelled",
  });

  await notificationService.createOrderCancelledNotification(
    order,
    order.cancellationReason,
  );

  await socketService.emitOrderCancelled(
    order.customer,
    order,
    order.cancellationReason,
  );

  return order;
}
