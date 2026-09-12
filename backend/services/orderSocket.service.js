import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import { getSocketServer } from "../socket/socketServer.js";
import { pushPayloadFor } from "./orderNotification.service.js";
import { sendPushToUser } from "./push.service.js";

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
/**
 * Emits to the customer, falling back to a push when nobody is listening.
 *
 * emitToCustomer already returns false for an empty room, so "not connected" is
 * information we are handed rather than something to compute. iOS suspends the
 * socket within ~30s of backgrounding, which makes that a good proxy for "the
 * app is not in front of them". Android can hold a socket open while hidden, so
 * a notification is occasionally skipped there; making it exact needs the client
 * to leave its rooms on background, which is a later change.
 */
async function deliverToCustomer(socketServer, customerId, event, payload, pushType) {
  const live = socketServer.emitToCustomer(customerId, event, payload);
  if (live || !pushType) return;
  await sendPushToUser(customerId, pushPayloadFor(pushType, payload.order));
}

export async function emitOrderConfirmed(customerId, order, estimatedTime) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    await deliverToCustomer(socketServer, customerId, "order:confirmed", {
      order: populatedOrder,
      estimatedTime,
      message: "Your order has been confirmed!",
    }, "order_confirmed");
  } catch (error) {
    console.error("Socket emit error (order:confirmed):", error);
  }
}

export async function emitOrderRejected(customerId, order, reason) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    await deliverToCustomer(socketServer, customerId, "order:rejected", {
      order: populatedOrder,
      reason,
      message: "Sorry, your order was rejected by the restaurant",
    }, "order_rejected");
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

    await deliverToCustomer(
      socketServer,
      customerId,
      eventName,
      { order: populatedOrder, message },
      newStatus === "preparing" ? "order_preparing" : "order_ready",
    );
  } catch (error) {
    console.error(`Socket emit error (order:${newStatus}):`, error);
  }
}

export async function emitOrderCancelled(customerId, order, reason) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    await deliverToCustomer(
      socketServer,
      customerId,
      "order:cancelled",
      {
        order: populatedOrder,
        reason,
        message: "Your order was cancelled by the restaurant",
      },
      "order_cancelled",
    );
  } catch (error) {
    console.error("Socket emit error (order:cancelled):", error);
  }
}

/**
 * A new order reaches the restaurant. The seller currently has no push
 * fallback, so when the socket room is empty the order simply waits - this is
 * the one place that needs to change to fix it.
 */
export async function emitOrderPlaced(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    const live = socketServer.emitToRestaurant(populatedOrder.restaurant._id, "order:new", {
      order: populatedOrder,
      message: "New order received!",
      sound: "new_order",
    });

    // The same socket-first, push-when-nobody-is-listening rule the customer
    // already had. Without it a seller whose app is backgrounded - which iOS
    // does to the socket within ~30s - learned nothing, and the order sat in
    // pending until they happened to reopen the app.
    if (!live) {
      const restaurant = await Restaurant.findById(populatedOrder.restaurant._id)
        .select("ownerId")
        .lean();
      if (restaurant?.ownerId) {
        await sendPushToUser(restaurant.ownerId, pushPayloadFor("order_placed", populatedOrder));
      }
    }
  } catch (error) {
    console.error("Socket emit error (order:new):", error);
  }
}

/**
 * A customer cancelling reaches the restaurant and, when one is already
 * attached, the courier - who would otherwise keep driving to the restaurant
 * for an order that no longer exists.
 */
export async function emitOrderCancelledByCustomer(order, reason) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);
    const payload = {
      order: populatedOrder,
      reason,
      message: `Order #${populatedOrder.orderNumber} was cancelled by the customer`,
    };

    socketServer.emitToRestaurant(populatedOrder.restaurant._id, "order:cancelled", payload);

    const courierId = populatedOrder.courier?._id ?? order.courier;
    if (courierId) {
      const live = socketServer.emitToCourier(courierId, "order:cancelled", payload);
      if (!live) {
        // getPopulatedOrder deliberately does not select courier.userId - it
        // would ride along to the customer on every other emit - so read it
        // here instead.
        const courierDoc = await Courier.findById(courierId, { userId: 1 }).lean();
        if (courierDoc?.userId) {
          await sendPushToUser(courierDoc.userId, pushPayloadFor("order_cancelled", populatedOrder));
        }
      }
    }
  } catch (error) {
    console.error("Socket emit error (order:cancelled by customer):", error);
  }
}

export async function emitOrderAssigned(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    await deliverToCustomer(
      socketServer,
      populatedOrder.customer._id,
      "order:assigned",
      { order: populatedOrder, message: "A courier has been assigned to your order" },
      "order_assigned",
    );

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

    await deliverToCustomer(
      socketServer,
      populatedOrder.customer._id,
      "order:picked_up",
      { order: populatedOrder, message: "Courier picked up your order", },
      "order_picked_up",
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

    await deliverToCustomer(
      socketServer,
      populatedOrder.customer._id,
      "order:in_transit",
      { order: populatedOrder, message: "Courier is on the way", },
      "order_in_transit",
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

    await deliverToCustomer(
      socketServer,
      populatedOrder.customer._id,
      "order:delivered",
      { order: populatedOrder, message: "Order delivered", },
      "order_delivered",
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

/**
 * Which couriers should be pushed about a newly available order: those who
 * could actually take it, minus those already watching the pool over a socket.
 *
 * Exported so the selection can be asserted on its own - the emitter around it
 * needs a live socket server and the Expo transport, and neither is worth
 * standing up to check a query.
 *
 * @param {Set<string>} connectedCourierIds
 * @returns {Promise<string[]>} user ids
 */
export async function poolPushRecipients(connectedCourierIds) {
  const eligible = await Courier.find(
    { isAvailable: true, verificationStatus: "verified", currentOrder: null },
    { userId: 1 },
  ).lean();

  return eligible
    .filter((courier) => !connectedCourierIds.has(String(courier._id)))
    .map((courier) => String(courier.userId));
}

export async function emitNewOrderAvailable(order) {
  try {
    const socketServer = getSocketServer();

    socketServer.emitToCourierPool("order:available", {
      orderId: String(order._id),
      restaurantId: String(order.restaurant),
    });

    // The pool was socket-only, so a courier with the app in their pocket never
    // saw an order appear. Only couriers who could actually take it, and only
    // those whose socket is not already in the pool room.
    const recipients = await poolPushRecipients(socketServer.connectedCourierIds());
    if (recipients.length === 0) return;

    const populatedOrder = await getPopulatedOrder(order._id);
    const payload = pushPayloadFor("order_available", populatedOrder);

    // Sequential rather than Promise.all: this fans out across the whole
    // on-duty fleet and each call is itself a batched Expo request.
    for (const userId of recipients) {
      await sendPushToUser(userId, payload);
    }
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
