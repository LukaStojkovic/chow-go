import Order from "../models/Order.js";
import Courier from "../models/Courier.js";
import Restaurant from "../models/Restaurant.js";
import { getSocketServer } from "../socket/socketServer.js";
import { pushPayloadFor } from "./orderNotification.service.js";
import { sendPushToUser, sendPushToUsers } from "./push.service.js";
import { logger } from "../utils/logger.js";

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
 * An empty customer room is the signal, counted across every instance when the
 * Redis adapter is on. iOS suspends the socket within ~30s of backgrounding,
 * which makes that a good proxy for "the app is not in front of them". Android can hold a socket open while hidden, so
 * a notification is occasionally skipped there; making it exact needs the client
 * to leave its rooms on background, which is a later change.
 */
async function deliverToCustomer(socketServer, customerId, event, payload, pushType) {
  const live = pushType ? await socketServer.isCustomerLive(customerId) : true;
  socketServer.emitToCustomer(customerId, event, payload);
  if (live) return;
  // A builder, not a payload: sendPushToUser knows the recipient's locale
  // because it loads their user document anyway.
  await sendPushToUser(customerId, (locale) =>
    pushPayloadFor(pushType, payload.order, locale),
  );
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
    logger.error({ err: error }, "Socket emit error (order:confirmed)");
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
    logger.error({ err: error }, "Socket emit error (order:rejected)");
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
    logger.error({ err: error }, `Socket emit error (order:${newStatus})`);
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
    logger.error({ err: error }, "Socket emit error (order:cancelled)");
  }
}

/**
 * A new order reaches the restaurant: over the socket when a seller is
 * connected, otherwise as a push to the owner.
 */
export async function emitOrderPlaced(order) {
  try {
    const socketServer = getSocketServer();
    const populatedOrder = await getPopulatedOrder(order._id);

    const live = await socketServer.isRestaurantLive(populatedOrder.restaurant._id);
    socketServer.emitToRestaurant(populatedOrder.restaurant._id, "order:new", {
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
        await sendPushToUser(restaurant.ownerId, (locale) =>
          pushPayloadFor("order_placed", populatedOrder, locale),
        );
      }
    }
  } catch (error) {
    logger.error({ err: error }, "Socket emit error (order:new)");
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
      const live = await socketServer.isCourierLive(courierId);
      socketServer.emitToCourier(courierId, "order:cancelled", payload);
      if (!live) {
        // getPopulatedOrder deliberately does not select courier.userId - it
        // would ride along to the customer on every other emit - so read it
        // here instead.
        const courierDoc = await Courier.findById(courierId, { userId: 1 }).lean();
        if (courierDoc?.userId) {
          await sendPushToUser(courierDoc.userId, (locale) =>
            pushPayloadFor("order_cancelled", populatedOrder, locale),
          );
        }
      }
    }
  } catch (error) {
    logger.error({ err: error }, "Socket emit error (order:cancelled by customer)");
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
    logger.error({ err: error }, "Socket emit error (order:assigned)");
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
    logger.error({ err: error }, "Socket emit error (order:courier_unassigned)");
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
    logger.error({ err: error }, "Socket emit error (order:picked_up)");
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
    logger.error({ err: error }, "Socket emit error (order:in_transit)");
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
    logger.error({ err: error }, "Socket emit error (order:delivered)");
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
    logger.error({ err: error }, "Socket emit error (courier:location)");
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
const POOL_PUSH_RADIUS_KM = 15;

// With `near` ([lng, lat] of the restaurant), only couriers whose last known
// position is within the radius the pool itself uses: a push to every on-duty
// courier in the country is noise to them and cost to us.
export async function poolPushRecipients(connectedCourierIds, near) {
  const filter = { isAvailable: true, verificationStatus: "verified", currentOrder: null };
  if (Array.isArray(near) && near.length === 2) {
    filter.currentLocation = {
      $geoWithin: { $centerSphere: [near, POOL_PUSH_RADIUS_KM / 6378.1] },
    };
  }
  const eligible = await Courier.find(filter, { userId: 1 }).lean();

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
    const populatedOrder = await getPopulatedOrder(order._id);
    const recipients = await poolPushRecipients(
      await socketServer.connectedCourierIds(),
      populatedOrder.restaurant?.location?.coordinates,
    );
    if (recipients.length === 0) return;

    await sendPushToUsers(recipients, (locale) =>
      pushPayloadFor("order_available", populatedOrder, locale),
    );
  } catch (error) {
    logger.error({ err: error }, "Socket emit error (order:available)");
  }
}

export function emitOrderTaken(orderId) {
  try {
    getSocketServer().emitToCourierPool("order:taken", {
      orderId: String(orderId),
    });
  } catch (error) {
    logger.error({ err: error }, "Socket emit error (order:taken)");
  }
}

export function emitOrderBackToPool(order) {
  try {
    getSocketServer().emitToCourierPool("order:available", {
      orderId: String(order._id),
      restaurantId: String(order.restaurant),
    });
  } catch (error) {
    logger.error({ err: error }, "Socket emit error (order:available - back to pool)");
  }
}
