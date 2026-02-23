import Order from "../models/Order.js";
import { getSocketServer } from "../socket/socketServer.js";

export async function emitOrderConfirmed(customerId, order, estimatedTime) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone");

    socketServer.emitToCustomer(customerId, "order:confirmed", {
      order: populatedOrder,
      estimatedTime,
      message: "Your order has been confirmed!",
    });
  } catch (error) {
    console.error("Socket emit error (order:confirmed):", error);
  }
}

export async function emitOrderRejected(customerId, order, reason) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone");

    socketServer.emitToCustomer(customerId, "order:rejected", {
      order: populatedOrder,
      reason,
      message: "Sorry, your order was rejected by the restaurant",
    });
  } catch (error) {
    console.error("Socket emit error (order:rejected):", error);
  }
}

export async function emitOrderStatusChanged(customerId, order, newStatus) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone");

    const statusMessages = {
      preparing: "Your order is being prepared",
      ready: "Your order is ready!",
    };

    const eventName =
      newStatus === "preparing" ? "order:preparing" : "order:ready";
    const message =
      statusMessages[newStatus] || `Order status updated to ${newStatus}`;

    socketServer.emitToCustomer(customerId, eventName, {
      order: populatedOrder,
      message,
    });
  } catch (error) {
    console.error(`Socket emit error (order:${newStatus}):`, error);
  }
}

export async function emitOrderCancelled(customerId, order, reason) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone");

    socketServer.emitToCustomer(customerId, "order:cancelled", {
      order: populatedOrder,
      reason,
      message: "Your order was cancelled by the restaurant",
    });
  } catch (error) {
    console.error("Socket emit error (order:cancelled):", error);
  }
}
