import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import * as orderStatus from "../utils/orderStatus.js";
import * as notificationService from "./orderNotification.service.js";
import * as socketService from "./orderSocket.service.js";

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
      .populate("courier", "fullName phoneNumber vehicleType")
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
    .populate("courier", "fullName phoneNumber vehicleType")
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
  const order = await Order.findOne({
    _id: orderId,
    restaurant: restaurantId,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!orderStatus.canConfirm(order.status)) {
    throw new AppError("Order cannot be confirmed", 400);
  }

  const prepTime = estimatedPreparationTime || 30;
  order.status = "confirmed";
  order.confirmedAt = new Date();
  order.estimatedPreparationTime = prepTime;
  order.estimatedDeliveryTime = new Date(
    Date.now() + prepTime * 60 * 1000 + 30 * 60 * 1000,
  );

  await order.save();

  await notificationService.createOrderConfirmedNotification(order);

  await socketService.emitOrderConfirmed(order.customer, order, prepTime);

  return order;
}

export async function rejectOrderOperation(orderId, restaurantId, reason) {
  const order = await Order.findOne({
    _id: orderId,
    restaurant: restaurantId,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!orderStatus.canReject(order.status)) {
    throw new AppError("Order cannot be rejected", 400);
  }

  order.status = "rejected";
  order.rejectedAt = new Date();
  order.rejectionReason = reason || "Rejected by restaurant";

  await order.save();

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
  const order = await Order.findOne({
    _id: orderId,
    restaurant: restaurantId,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!orderStatus.isValidTransition(order.status, newStatus)) {
    throw new AppError("Invalid status transition", 400);
  }

  order.status = newStatus;

  if (newStatus === "preparing") {
    order.preparingAt = new Date();
  } else if (newStatus === "ready") {
    order.readyAt = new Date();
  }

  await order.save();

  await notificationService.createOrderStatusNotification(order, newStatus);

  await socketService.emitOrderStatusChanged(order.customer, order, newStatus);

  return order;
}

export async function cancelOrderOperation(orderId, restaurantId, reason) {
  const order = await Order.findOne({
    _id: orderId,
    restaurant: restaurantId,
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!orderStatus.canCancel(order.status)) {
    throw new AppError("Order cannot be cancelled at this stage", 400);
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancellationReason = reason || "Cancelled by restaurant";
  order.cancelledBy = "restaurant";

  await order.save();

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
