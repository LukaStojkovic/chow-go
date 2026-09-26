import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";
import { rejectOrderOperation } from "./restaurantOrder.service.js";
import * as notificationService from "./orderNotification.service.js";
import * as socketService from "./orderSocket.service.js";

// Nothing used to move an order a person had abandoned: a pending order a
// restaurant never answered sat there forever, a courier could sit on an
// assigned order indefinitely, and a delivery whose courier vanished could not
// be cancelled by anyone. These run from the cron job every minute. Each write
// is conditional on the status it expects, so overlapping runs - or several
// backend instances each running the cron - cannot double-apply.

const BATCH = 100;
const minutesAgo = (now, minutes) => new Date(now.getTime() - minutes * 60 * 1000);

export const AUTO_REJECT_REASON = "The restaurant did not respond in time";
export const AUTO_RELEASE_REASON = "Released automatically: not picked up in time";

export async function rejectStalePendingOrders(now = new Date()) {
  const stale = await Order.find({
    status: "pending",
    createdAt: { $lt: minutesAgo(now, env.pendingTimeoutMinutes) },
  })
    .select("_id restaurant")
    .limit(BATCH)
    .lean();

  let rejected = 0;
  for (const order of stale) {
    try {
      await rejectOrderOperation(order._id, order.restaurant, AUTO_REJECT_REASON);
      rejected++;
    } catch (error) {
      if (error?.code !== "ORDER_STATUS_CONFLICT") {
        logger.error({ err: error, orderId: String(order._id) }, "Auto-reject failed");
      }
    }
  }
  return rejected;
}

export async function releaseStaleAssignments(now = new Date()) {
  const stale = await Order.find({
    status: "assigned",
    assignedAt: { $lt: minutesAgo(now, env.assignedTimeoutMinutes) },
  })
    .select("_id courier")
    .limit(BATCH)
    .lean();

  let released = 0;
  for (const { _id, courier } of stale) {
    const order = await Order.findOneAndUpdate(
      { _id, status: "assigned", courier },
      { $set: { status: "ready", courier: null, assignedAt: null, courierNotes: AUTO_RELEASE_REASON } },
      { new: true },
    );
    if (!order) continue;
    await Courier.updateOne(
      { _id: courier, currentOrder: _id },
      { $set: { currentOrder: null, isAvailable: true } },
    );
    await socketService.emitOrderCourierUnassigned(order, AUTO_RELEASE_REASON);
    socketService.emitOrderBackToPool(order);
    released++;
  }
  return released;
}

// No admin surface exists to act on these, so the most useful thing is a log
// line an alert can key on.
export async function reportStuckDeliveries(now = new Date()) {
  const stuck = await Order.find({
    status: { $in: ["picked_up", "in_transit"] },
    pickedUpAt: { $lt: minutesAgo(now, env.stuckDeliveryMinutes) },
  })
    .select("_id orderNumber courier status pickedUpAt")
    .limit(BATCH)
    .lean();

  if (stuck.length > 0) {
    logger.warn(
      { orders: stuck.map((o) => ({ id: String(o._id), orderNumber: o.orderNumber, courier: String(o.courier), status: o.status })) },
      `${stuck.length} deliveries in progress for over ${env.stuckDeliveryMinutes} minutes`,
    );
  }
  return stuck.length;
}

export async function recoverStuckOrders(now = new Date()) {
  const [rejected, released, stuck] = [
    await rejectStalePendingOrders(now),
    await releaseStaleAssignments(now),
    await reportStuckDeliveries(now),
  ];
  if (rejected || released) {
    logger.info({ rejected, released, stuck }, "Recovered stuck orders");
  }
  return { rejected, released, stuck };
}

/**
 * Support's way to end any order that is not finished, until there is an admin
 * console. Frees the courier and tells the customer, restaurant and courier.
 * Used by scripts/forceCancelOrder.js.
 */
export async function forceCancelOrder(orderId, reason) {
  const cancellationReason = `Cancelled by support: ${reason || "no reason given"}`;
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: { $nin: ["delivered", "cancelled", "rejected"] } },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason,
        cancelledBy: "admin",
      },
    },
    { new: true },
  );

  if (!order) {
    const exists = await Order.exists({ _id: orderId });
    throw new AppError(exists ? "That order is already finished" : "Order not found", exists ? 409 : 404);
  }

  if (order.courier) {
    await Courier.updateOne(
      { _id: order.courier, currentOrder: order._id },
      { $set: { currentOrder: null, isAvailable: true } },
    );
  }

  await notificationService.createOrderCancelledNotification(order, cancellationReason);
  await socketService.emitOrderCancelled(order.customer, order, cancellationReason);
  await socketService.emitOrderCancelledByCustomer(
    { _id: order._id, courier: order.courier, restaurant: order.restaurant },
    cancellationReason,
  );

  return order;
}
