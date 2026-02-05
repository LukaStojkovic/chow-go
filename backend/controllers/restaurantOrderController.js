import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Notification from "../models/OrderNotification.js";
import { AppError } from "../utils/AppError.js";
import { getSocketServer } from "../socket/socketServer.js";

export async function getRestaurantOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    const query = { restaurant: restaurant._id };

    if (status) {
      if (status === "active") {
        query.status = {
          $in: [
            "pending",
            "confirmed",
            "preparing",
            "ready",
            "assigned",
            "picked_up",
            "in_transit",
          ],
        };
      } else if (status.includes(",")) {
        query.status = { $in: status.split(",") };
      } else {
        query.status = status;
      }
    }

    if (search) {
      query.$or = [{ orderNumber: { $regex: search, $options: "i" } }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate("customer", "name phoneNumber email")
      .populate("courier", "fullName phoneNumber vehicleType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalItems = await Order.countDocuments(query);

    const statusCounts = await Order.aggregate([
      { $match: { restaurant: restaurant._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
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
      counts[item._id] = item.count;
    });

    counts.active =
      (counts.pending || 0) +
      (counts.confirmed || 0) +
      (counts.preparing || 0) +
      (counts.ready || 0);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        counts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalItems / parseInt(limit)),
          totalItems,
          limit: parseInt(limit),
          hasNext: parseInt(page) < Math.ceil(totalItems / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { estimatedPreparationTime } = req.body;

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurant._id,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (order.status !== "pending") {
      return next(new AppError("Order cannot be confirmed", 400));
    }

    order.status = "confirmed";
    order.confirmedAt = new Date();
    order.estimatedPreparationTime = estimatedPreparationTime || 30;
    order.estimatedDeliveryTime = new Date(
      Date.now() +
        (estimatedPreparationTime || 30) * 60 * 1000 +
        30 * 60 * 1000,
    );

    await order.save();

    await Notification.create({
      recipient: order.customer,
      recipientRole: "customer",
      type: "order_confirmed",
      order: order._id,
      title: "Order Confirmed!",
      message: `Your order #${order.orderNumber} has been confirmed`,
      priority: "high",
    });

    // TODO: Emit socket event for real-time update
    try {
      const socketServer = getSocketServer();
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name email phoneNumber")
        .populate("restaurant", "name profilePicture address phone");

      socketServer.emitToCustomer(order.customer, "order:confirmed", {
        order: populatedOrder,
        estimatedTime: order.estimatedPreparationTime,
        message: "Your order has been confirmed!",
      });
    } catch (error) {
      console.error("Socket emit error:", error);
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurant._id,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (order.status !== "pending") {
      return next(new AppError("Order cannot be rejected", 400));
    }

    order.status = "rejected";
    order.rejectedAt = new Date();
    order.rejectionReason = reason || "Rejected by restaurant";

    await order.save();

    await Notification.create({
      recipient: order.customer,
      recipientRole: "customer",
      type: "order_rejected",
      order: order._id,
      title: "Order Rejected",
      message: `Your order #${order.orderNumber} was rejected`,
      priority: "high",
    });

    // TODO: Emit socket event
    try {
      const socketServer = getSocketServer();
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name email phoneNumber")
        .populate("restaurant", "name profilePicture address phone");

      socketServer.emitToCustomer(order.customer, "order:rejected", {
        order: populatedOrder,
        reason: order.rejectionReason,
        message: "Sorry, your order was rejected by the restaurant",
      });
    } catch (error) {
      console.error("Socket emit error:", error);
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurant._id,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    const validTransitions = {
      confirmed: ["preparing"],
      preparing: ["ready"],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return next(new AppError("Invalid status transition", 400));
    }

    order.status = status;

    if (status === "preparing") {
      order.preparingAt = new Date();
    } else if (status === "ready") {
      order.readyAt = new Date();
    }

    await order.save();

    const notificationMessages = {
      preparing: "Your order is being prepared",
      ready: "Your order is ready!",
    };

    await Notification.create({
      recipient: order.customer,
      recipientRole: "customer",
      type: `order_${status}`,
      order: order._id,
      title: notificationMessages[status],
      message: `Order #${order.orderNumber} - ${notificationMessages[status]}`,
      priority: status === "ready" ? "high" : "medium",
    });

    // TODO: Emit socket event
    try {
      const socketServer = getSocketServer();
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name email phoneNumber")
        .populate("restaurant", "name profilePicture address phone");

      const eventName =
        status === "preparing" ? "order:preparing" : "order:ready";

      socketServer.emitToCustomer(order.customer, eventName, {
        order: populatedOrder,
        message: notificationMessages[status],
      });
    } catch (error) {
      console.error("Socket emit error:", error);
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRestaurantOrderById(req, res, next) {
  try {
    const { orderId } = req.params;

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurant._id,
    })
      .populate("customer", "name email phoneNumber")
      .populate("courier", "fullName phoneNumber vehicleType")
      .populate("items.menuItem", "name imageUrls");

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelRestaurantOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurant._id,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (!["confirmed", "preparing", "ready"].includes(order.status)) {
      return next(new AppError("Order cannot be cancelled at this stage", 400));
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by restaurant";
    order.cancelledBy = "restaurant";

    await order.save();

    await Notification.create({
      recipient: order.customer,
      recipientRole: "customer",
      type: "order_cancelled",
      order: order._id,
      title: "Order Cancelled",
      message: `Your order #${order.orderNumber} was cancelled by the restaurant`,
      priority: "high",
      data: {
        reason: order.cancellationReason,
      },
    });

    try {
      const socketServer = getSocketServer();
      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name email phoneNumber")
        .populate("restaurant", "name profilePicture address phone");

      socketServer.emitToCustomer(order.customer, "order:cancelled", {
        order: populatedOrder,
        reason: order.cancellationReason,
        message: "Your order was cancelled by the restaurant",
      });
    } catch (error) {
      console.error("Socket emit error:", error);
    }

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}
