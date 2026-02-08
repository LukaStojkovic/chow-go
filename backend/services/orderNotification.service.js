import Notification from "../models/OrderNotification.js";

const NOTIFICATION_TEMPLATES = {
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
};

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
