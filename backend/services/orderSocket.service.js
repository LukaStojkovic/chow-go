import Order from "../models/Order.js";
import { getSocketServer } from "../socket/socketServer.js";

async function getPopulatedOrder(orderId) {
  const order = await Order.findById(orderId)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation lastLocationUpdate")
    .populate("items.menuItem", "name imageUrls");
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }
  return order;
}
export async function emitOrderConfirmed(customerId, order, estimatedTime) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

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
    const populatedOrder = await getPopulatedOrder(order._id);

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
    const populatedOrder = await getPopulatedOrder(order._id);

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
    const populatedOrder = await getPopulatedOrder(order._id);

    socketServer.emitToCustomer(customerId, "order:cancelled", {
      order: populatedOrder,
      reason,
      message: "Your order was cancelled by the restaurant",
    });
  } catch (error) {
    console.error("Socket emit error (order:cancelled):", error);
  }
}

export async function emitOrderAssigned(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    socketServer.emitToCustomer(populatedOrder.customer._id, "order:assigned", {
      order: populatedOrder,
      message: "A courier has been assigned to your order",
    });

    socketServer.emitToRestaurant(
      populatedOrder.restaurant._id,
      "order:assigned",
      {
        order: populatedOrder,
        message: "A courier accepted the order",
      },
    );

    if (populatedOrder.courier?._id) {
      socketServer.emitToCourier(populatedOrder.courier._id, "order:assigned", {
        order: populatedOrder,
        message: "Order assigned to you",
      });
    }
  } catch (error) {
    console.error("Socket emit error (order:assigned):", error);
  }
}

export async function emitOrderCourierUnassigned(order, reason) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    socketServer.emitToRestaurant(
      populatedOrder.restaurant._id,
      "order:courier_unassigned",
      {
        order: populatedOrder,
        reason,
        message: "Courier cancelled assignment",
      },
    );
  } catch (error) {
    console.error("Socket emit error (order:courier_unassigned):", error);
  }
}

export async function emitOrderPickedUp(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    socketServer.emitToCustomer(
      populatedOrder.customer._id,
      "order:picked_up",
      {
        order: populatedOrder,
        message: "Courier picked up your order",
      },
    );
    socketServer.emitToRestaurant(
      populatedOrder.restaurant._id,
      "order:picked_up",
      {
        order: populatedOrder,
        message: "Order picked up by courier",
      },
    );
    if (populatedOrder.courier?._id) {
      socketServer.emitToCourier(
        populatedOrder.courier._id,
        "order:picked_up",
        {
          order: populatedOrder,
          message: "Marked as picked up",
        },
      );
    }
  } catch (error) {
    console.error("Socket emit error (order:picked_up):", error);
  }
}

export async function emitOrderInTransit(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    socketServer.emitToCustomer(
      populatedOrder.customer._id,
      "order:in_transit",
      {
        order: populatedOrder,
        message: "Courier is on the way",
      },
    );
    socketServer.emitToRestaurant(
      populatedOrder.restaurant._id,
      "order:in_transit",
      {
        order: populatedOrder,
        message: "Courier started delivery",
      },
    );
    if (populatedOrder.courier?._id) {
      socketServer.emitToCourier(
        populatedOrder.courier._id,
        "order:in_transit",
        {
          order: populatedOrder,
          message: "Marked as in transit",
        },
      );
    }
  } catch (error) {
    console.error("Socket emit error (order:in_transit):", error);
  }
}

export async function emitOrderDelivered(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    socketServer.emitToCustomer(
      populatedOrder.customer._id,
      "order:delivered",
      {
        order: populatedOrder,
        message: "Order delivered",
      },
    );
    socketServer.emitToRestaurant(
      populatedOrder.restaurant._id,
      "order:delivered",
      {
        order: populatedOrder,
        message: "Order delivered to customer",
      },
    );
    if (populatedOrder.courier?._id) {
      socketServer.emitToCourier(
        populatedOrder.courier._id,
        "order:delivered",
        {
          order: populatedOrder,
          message: "Delivery completed",
        },
      );
    }
  } catch (error) {
    console.error("Socket emit error (order:delivered):", error);
  }
}

export function emitCourierLocationUpdated({
  orderId,
  customerId,
  restaurantId,
  courierId,
  coordinates,
  timestamp,
}) {
  try {
    const socketServer = getSocketServer();

    const payload = {
      orderId: String(orderId),
      courierId: String(courierId),
      coordinates,
      timestamp,
    };

    if (customerId) {
      socketServer.emitToCustomer(customerId, "courier:location", payload);
    }
    if (restaurantId) {
      socketServer.emitToRestaurant(restaurantId, "courier:location", payload);
    }
    socketServer.emitToCourier(courierId, "courier:location", payload);
  } catch (error) {
    console.error("Socket emit error (courier:location):", error);
  }
}

export function emitNewOrderAvailable(order) {
  try {
    getSocketServer().emitToCourierPool("order:available", {
      orderId: String(order._id),
      restaurantId: String(order.restaurant),
    });
  } catch (error) {
    console.error("Socket emit error (order:available):", error);
  }
}

export function emitOrderTaken(orderId) {
  try {
    getSocketServer().emitToCourierPool("order:taken", {
      orderId: String(orderId),
    });
  } catch (error) {
    console.error("Socket emit error (order:taken):", error);
  }
}

export function emitOrderBackToPool(order) {
  try {
    getSocketServer().emitToCourierPool("order:available", {
      orderId: String(order._id),
      restaurantId: String(order.restaurant),
    });
  } catch (error) {
    console.error("Socket emit error (order:available - back to pool):", error);
  }
}
