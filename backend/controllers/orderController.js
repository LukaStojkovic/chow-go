import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Addresses from "../models/Addresses.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import Notification from "../models/OrderNotification.js";
import { getSocketServer } from "../socket/socketServer.js";

export async function createOrder(req, res, next) {
  try {
    const {
      restaurantId,
      deliveryAddressId,
      paymentMethod,
      customerNotes,
      tip,
      deliveryType,
    } = req.body;

    const userId = req.user._id;

    if (!restaurantId || !deliveryAddressId || !paymentMethod) {
      return next(new AppError("Missing required fields", 400));
    }

    const cart = await Cart.findOne({
      user: userId,
      restaurant: restaurantId,
    }).populate("items.menuItem");

    if (!cart || cart.items.length === 0) {
      return next(new AppError("Cart is empty", 400));
    }

    const deliveryAddress = await Addresses.findOne({
      _id: deliveryAddressId,
      userId,
      isDeleted: false,
    });

    if (!deliveryAddress) {
      return next(new AppError("Delivery address not found", 404));
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return next(new AppError("Restaurant not available", 400));
    }

    if (!restaurant.isOpenNow) {
      return next(new AppError("Restaurant is currently closed", 400));
    }

    const subtotal = cart.totalPrice;
    const baseDeliveryFee = 2.5;
    const serviceFee = 1.5;
    const priorityFee = deliveryType === "priority" ? 1.99 : 0;
    const deliveryFee = baseDeliveryFee + priorityFee;
    const tax = 0;
    const tipAmount = parseFloat(tip) || 0;
    const total = subtotal + deliveryFee + serviceFee + tax + tipAmount;

    for (const item of cart.items) {
      if (!item.menuItem.available) {
        return next(
          new AppError(
            `Item "${item.menuItem.name}" is no longer available`,
            400,
          ),
        );
      }
    }

    const order = new Order({
      customer: userId,
      restaurant: restaurantId,
      items: cart.items.map((item) => ({
        menuItem: item.menuItem._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      deliveryAddress: deliveryAddressId,
      deliveryAddressSnapshot: {
        label: deliveryAddress.label,
        fullAddress: deliveryAddress.fullAddress,
        buildingName: deliveryAddress.buildingName,
        apartment: deliveryAddress.apartment,
        floor: deliveryAddress.floor,
        entrance: deliveryAddress.entrance,
        doorCode: deliveryAddress.doorCode,
        notes: deliveryAddress.notes,
        location: deliveryAddress.location,
      },
      subtotal,
      deliveryFee,
      tax,
      tip: tipAmount,
      discount: 0,
      total,
      paymentMethod,
      customerNotes: customerNotes || "",
      estimatedPreparationTime: 30,
      estimatedDeliveryTime: new Date(
        Date.now() + (deliveryType === "priority" ? 45 : 60) * 60 * 1000,
      ),
    });

    await order.save();

    await Cart.findByIdAndDelete(cart._id);

    deliveryAddress.lastUsedAt = new Date();
    await deliveryAddress.save();

    await Notification.create({
      recipient: restaurant.ownerId,
      recipientRole: "seller",
      type: "order_placed",
      order: order._id,
      title: "New Order!",
      message: `You have a new order #${order.orderNumber} - $${total.toFixed(2)}`,
      priority: "high",
      data: {
        orderNumber: order.orderNumber,
        total: total,
        itemsCount: order.items.length,
      },
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone")
      .populate("items.menuItem", "name imageUrls");

    try {
      const socketServer = getSocketServer();
      socketServer.emitToRestaurant(restaurantId, "order:new", {
        order: populatedOrder,
        message: "New order received!",
        sound: "new_order",
      });
    } catch (error) {
      console.error("Socket emit error:", error);
    }

    res.status(201).json({
      status: "success",
      data: {
        order: populatedOrder,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const query = { customer: userId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate("restaurant", "name profilePicture address phone")
      .populate("courier", "fullName phoneNumber vehicleType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalItems = await Order.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        orders,
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

export async function getOrderById(req, res, next) {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      customer: userId,
    })
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone location")
      .populate("courier", "fullName phoneNumber vehicleType currentLocation")
      .populate("items.menuItem", "name imageUrls");

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (["picked_up", "in_transit", "delivered"].includes(order.status)) {
      return next(new AppError("Cannot cancel order at this stage", 400));
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer";
    order.cancelledBy = "customer";

    await order.save();

    const restaurant = await Restaurant.findById(order.restaurant);

    await Notification.create({
      recipient: restaurant.ownerId,
      recipientRole: "seller",
      type: "order_cancelled",
      order: order._id,
      title: "Order Cancelled",
      message: `Order #${order.orderNumber} was cancelled by customer`,
      priority: "high",
    });

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
}
