import Order from "../models/Order.js";
import { getSocketServer } from "../socket/socketServer.js";

async function getPopulatedOrder(orderId) {
  return await Order.findById(orderId)
    .populate("customer", "name email phoneNumber")
    .populate("restaurant", "name profilePicture address phone location")
    .populate("courier", "fullName phoneNumber vehicleType currentLocation")
    .populate("items.menuItem", "name imageUrls");
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

export async function emitCourierLocationUpdated(order, courier) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    const payload = {
      orderId: populatedOrder._id,
      courier: {
        _id: courier._id,
        currentLocation: courier.currentLocation,
        lastLocationUpdate: courier.lastLocationUpdate,
        fullName: courier.fullName,
        vehicleType: courier.vehicleType,
      },
    };

    socketServer.emitToCustomer(
      populatedOrder.customer._id,
      "courier:location",
      payload,
    );
    socketServer.emitToRestaurant(
      populatedOrder.restaurant._id,
      "courier:location",
      payload,
    );
    if (populatedOrder.courier?._id) {
      socketServer.emitToCourier(
        populatedOrder.courier._id,
        "courier:location",
        payload,
      );
    }
  } catch (error) {
    console.error("Socket emit error (courier:location):", error);
  }
}
