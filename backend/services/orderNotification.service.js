import Notification from "../models/OrderNotification.js";

const NOTIFICATION_TEMPLATES = {
  // Seller- and courier-facing. Everything below this pair is written to the
  // customer; these two exist because sendPushToUser was only ever called for
  // the customer, so a backgrounded seller learned nothing about a new order
  // and the pool was socket-only.
  order_placed: {
    title: "New order",
    messageTemplate: (orderNumber) => `Order #${orderNumber} is waiting for you to confirm`,
    type: "order_placed",
    priority: "high",
  },
  order_available: {
    title: "Delivery available",
    messageTemplate: (orderNumber) => `Order #${orderNumber} is ready for pickup`,
    type: "order_available",
    priority: "high",
  },
  order_confirmed: {
    title: "Order Confirmed!",
    messageTemplate: (orderNumber) =>
      `Your order #${orderNumber} has been confirmed`,
    type: "order_confirmed",
    priority: "high",
  },
  order_rejected: {
    title: "Order Rejected",
    messageTemplate: (orderNumber) => `Your order #${orderNumber} was rejected`,
    type: "order_rejected",
    priority: "high",
  },
  order_preparing: {
    title: "Order Preparing",
    messageTemplate: (orderNumber) =>
      `Order #${orderNumber} - Your order is being prepared`,
    type: "order_preparing",
    priority: "medium",
  },
  order_ready: {
    title: "Order Ready!",
    messageTemplate: (orderNumber) =>
      `Order #${orderNumber} - Your order is ready!`,
    type: "order_ready",
    priority: "high",
  },
  order_cancelled: {
    title: "Order Cancelled",
    messageTemplate: (orderNumber) =>
      `Your order #${orderNumber} was cancelled by the restaurant`,
    type: "order_cancelled",
    priority: "high",
  },

  // courierOrder.service.js has always passed these four to
  // createOrderStatusNotification, which returned null on a missing template -
  // so the entire courier half of the lifecycle silently persisted nothing.
  order_assigned: {
    title: "Courier Assigned",
    messageTemplate: (orderNumber) =>
      `A courier is picking up order #${orderNumber}`,
    type: "order_assigned",
    priority: "medium",
  },
  order_picked_up: {
    title: "Order Picked Up",
    messageTemplate: (orderNumber) =>
      `Order #${orderNumber} is on its way from the restaurant`,
    type: "order_picked_up",
    priority: "medium",
  },
  order_in_transit: {
    title: "On The Way",
    messageTemplate: (orderNumber) =>
      `Order #${orderNumber} is out for delivery`,
    type: "order_in_transit",
    priority: "high",
  },
  order_delivered: {
    title: "Delivered",
    messageTemplate: (orderNumber) => `Order #${orderNumber} has been delivered`,
    type: "order_delivered",
    priority: "high",
  },
};

/** Push copy comes from the same templates, so the two never drift apart. */
export function pushPayloadFor(type, order) {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) return null;

  return {
    title: template.title,
    body: template.messageTemplate(order?.orderNumber ?? ""),
    data: { type, orderId: String(order?._id ?? "") },
  };
}

export async function createOrderConfirmedNotification(order) {
  const template = NOTIFICATION_TEMPLATES.order_confirmed;

  return Notification.create({
    recipient: order.customer,
    recipientRole: "customer",
    type: template.type,
    order: order._id,
    title: template.title,
    message: template.messageTemplate(order.orderNumber),
    priority: template.priority,
  });
}

export async function createOrderRejectedNotification(order, reason) {
  const template = NOTIFICATION_TEMPLATES.order_rejected;

  return Notification.create({
    recipient: order.customer,
    recipientRole: "customer",
    type: template.type,
    order: order._id,
    title: template.title,
    message: template.messageTemplate(order.orderNumber),
    priority: template.priority,
    data: {
      reason: reason || "Rejected by restaurant",
    },
  });
}

export async function createOrderStatusNotification(order, newStatus) {
  const template = NOTIFICATION_TEMPLATES[`order_${newStatus}`];
  if (!template) return null;

  return Notification.create({
    recipient: order.customer,
    recipientRole: "customer",
    type: template.type,
    order: order._id,
    title: template.title,
    message: template.messageTemplate(order.orderNumber),
    priority: template.priority,
  });
}

export async function createOrderCancelledNotification(order, reason) {
  const template = NOTIFICATION_TEMPLATES.order_cancelled;

  return Notification.create({
    recipient: order.customer,
    recipientRole: "customer",
    type: template.type,
    order: order._id,
    title: template.title,
    message: template.messageTemplate(order.orderNumber),
    priority: template.priority,
    data: {
      reason: reason || "Cancelled by restaurant",
    },
  });
}
