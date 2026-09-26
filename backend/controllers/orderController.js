import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Addresses from "../models/Addresses.js";
import Restaurant from "../models/Restaurant.js";
import Courier from "../models/Courier.js";
import { AppError } from "../utils/AppError.js";
import Notification from "../models/OrderNotification.js";
import { rateOrderOperation } from "../services/orderRating.service.js";
import * as orderStatus from "../utils/orderStatus.js";
import { toMoney } from "../utils/money.js";
import * as orderSocketService from "../services/orderSocket.service.js";
import { repriceCartLines } from "../services/cartPricing.service.js";
import { PRICING } from "@chowgo/shared/adapters/pricing";
import { parsePagination } from "../utils/pagination.js";

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

    // A retry of the same attempt must return the original order, not a second
    // one. Checked before the cart is read, because the first attempt deleted it.
    const idempotencyKey = req.get("Idempotency-Key") || null;
    if (idempotencyKey && !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
      return next(new AppError("Invalid Idempotency-Key", 400, "IDEMPOTENCY_KEY_INVALID"));
    }
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey, customer: userId })
        .populate("customer", "name email phoneNumber")
        .populate("restaurant", "name profilePicture address phone")
        .populate("items.menuItem", "name imageUrls");

      if (existing) {
        return res.status(200).json({
          status: "success",
          data: { order: existing },
          idempotentReplay: true,
        });
      }
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
    if (String(restaurant.ownerId) === String(userId)) {
      return next(new AppError("errors:role.customerRequired", 403, "ROLE_REQUIRED"));
    }

    if (!restaurant.isOpenNow) {
      return next(new AppError("Restaurant is currently closed", 400));
    }

    // The cart holds the price from when each dish was added; the order is
    // charged what the menu charges now. A difference is shown to the customer
    // before anything is placed rather than silently applied.
    const { changes, unavailable } = repriceCartLines(cart);
    if (unavailable.length > 0) {
      return next(
        new AppError("errors:order.itemUnavailable", 400, "ITEM_UNAVAILABLE", {
          name: unavailable[0],
        }),
      );
    }
    if (changes.length > 0) {
      await cart.save();
      return next(
        new AppError("errors:order.priceChanged", 409, "PRICE_CHANGED", undefined, {
          priceChanges: changes,
        }),
      );
    }

    // Every figure is rounded to cents. Unrounded float arithmetic persisted
    // totals like 28.090000000000003, which display code hid but reporting and
    // any future reconciliation would not.
    const subtotal = toMoney(cart.totalPrice);
    const deliveryFee = 2.5;
    const serviceFee = 1.5;
    const priorityFee = deliveryType === "priority" ? 1.99 : 0;
    const tax = 0;
    // Uncapped, a 99999 tip was shown to every courier in the pool as bait and
    // added to the cash they had to collect; "1e400" parsed to Infinity.
    const tipNumber = tip === undefined || tip === null || tip === "" ? 0 : Number(tip);
    if (!Number.isFinite(tipNumber) || tipNumber < 0 || tipNumber > PRICING.maxTip) {
      return next(new AppError("errors:order.tipInvalid", 400, "TIP_INVALID", { max: PRICING.maxTip }));
    }
    const tipAmount = toMoney(tipNumber);
    const total = toMoney(subtotal + deliveryFee + serviceFee + priorityFee + tax + tipAmount);

    const order = new Order({
      customer: userId,
      restaurant: restaurantId,
      items: cart.items.map((item) => ({
        menuItem: item.menuItem._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
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
      priorityFee,
      tax,
      serviceFee,
      tip: tipAmount,
      discount: 0,
      total,
      paymentMethod,
      idempotencyKey,
      customerNotes: customerNotes || "",
      estimatedPreparationTime: restaurant.estimatedPreparationTime || 30,
      estimatedDeliveryTime: new Date(
        Date.now() + ((restaurant.estimatedPreparationTime || 30) + (deliveryType === "priority" ? 15 : 30)) * 60 * 1000,
      ),
    });

    // These four writes used to be independent: a failure after the order was
    // saved left a placed order with no seller notification and a cart already
    // deleted, and the customer saw an error for an order that actually exists.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // withTransaction retries this callback on a write conflict, and the
        // aborted attempt's save left Mongoose treating the order as already
        // stored, so the retry issued an update for a document that does not
        // exist and failed with a 500.
        order.isNew = true;
        await order.save({ session });

        // Without an Idempotency-Key, a second submit that read the cart before
        // the first committed found nothing to delete here and placed a second
        // order anyway. Exactly one checkout may consume a cart.
        const consumed = await Cart.deleteOne({ _id: cart._id }, { session });
        if (consumed.deletedCount !== 1) {
          throw new AppError("errors:order.alreadyPlaced", 409, "CART_ALREADY_ORDERED");
        }

        await Addresses.updateOne(
          { _id: deliveryAddress._id },
          { $set: { lastUsedAt: new Date() } },
          { session },
        );

        await Notification.create(
          [
            {
              recipient: restaurant.ownerId,
              recipientRole: "seller",
              type: "order_placed",
              order: order._id,
              title: "New Order!",
              message: `You have a new order #${order.orderNumber} - ${total.toFixed(2)}`,
              priority: "high",
              data: {
                orderNumber: order.orderNumber,
                total: total,
                itemsCount: order.items.length,
              },
            },
          ],
          { session },
        );
      });
    } catch (err) {
      // Two taps landing together: the loser hits the unique index rather than
      // creating a second order, and is handed the winner.
      if (err?.code === 11000 && idempotencyKey) {
        const winner = await Order.findOne({ idempotencyKey, customer: userId })
          .populate("customer", "name email phoneNumber")
          .populate("restaurant", "name profilePicture address phone")
          .populate("items.menuItem", "name imageUrls");

        if (winner) {
          return res.status(200).json({
            status: "success",
            data: { order: winner },
            idempotentReplay: true,
          });
        }
      }
      throw err;
    } finally {
      await session.endSession();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phoneNumber")
      .populate("restaurant", "name profilePicture address phone")
      .populate("items.menuItem", "name imageUrls");

    await orderSocketService.emitOrderPlaced(order);

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
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 });
    const userId = req.user._id;

    const query = { customer: userId };
    // parseStatusFilter turns "active" or a comma-separated list into an $in.
    // Assigning the raw string matched a literal "pending,confirmed,..." status
    // that no order has, so every multi-status filter returned nothing.
    if (status) query.status = orderStatus.parseStatusFilter(status);


    const orders = await Order.find(query)
      .populate("restaurant", "name profilePicture address phone")
      .populate("courier", "fullName phoneNumber profilePicture vehicleType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Order.countDocuments(query);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
          limit,
          hasNext: page < Math.ceil(totalItems / limit),
          hasPrev: page > 1,
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
      .populate("courier", "fullName phoneNumber profilePicture vehicleType currentLocation lastLocationUpdate")
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

    // One conditional write, like every other transition. This was read, check,
    // save: a cancel could overwrite a courier's picked_up or delivered, and a
    // courier who claimed the order between the read and the save was never
    // released, because the courier id came from the stale read.
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        customer: req.user._id,
        status: { $in: orderStatus.CUSTOMER_CANCELLABLE },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: reason || "Cancelled by customer",
          cancelledBy: "customer",
        },
      },
      { new: true },
    );

    if (!order) {
      const current = await Order.findOne({ _id: orderId, customer: req.user._id })
        .select("status")
        .lean();
      if (!current) return next(new AppError("Order not found", 404));
      return next(
        new AppError("Cannot cancel order at this stage", 400, "CANCEL_NOT_ALLOWED"),
      );
    }

    // Kept on the order as a record of who was on it; the courier themselves is
    // freed below.
    const assignedCourierId = order.courier;

    // Releasing the courier is the whole difference between a cancelled order
    // and a courier who can never work again: acceptOrderOperation refuses
    // them while isAvailable is false, and changeCourierDutyStatusOperation
    // refuses to put them back on duty while currentOrder is set, and a
    // cancelled order is not in COURIER_ACTIVE_STATUSES so they cannot clear
    // it by finishing either.
    if (assignedCourierId) {
      await Courier.updateOne(
        { _id: assignedCourierId, currentOrder: order._id },
        { $set: { currentOrder: null, isAvailable: true } },
      );
    }

    const restaurant = await Restaurant.findById(order.restaurant);

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    await Notification.create({
      recipient: restaurant.ownerId,
      recipientRole: "seller",
      type: "order_cancelled",
      order: order._id,
      title: "Order Cancelled",
      message: `Order #${order.orderNumber} was cancelled by customer`,
      priority: "high",
    });

    // Goes through the socket service like every other emit, which is also how
    // the assigned courier gets told - this handler used to notify only the
    // restaurant, leaving the courier driving to a cancelled order.
    await orderSocketService.emitOrderCancelledByCustomer(
      { _id: order._id, courier: assignedCourierId, restaurant: order.restaurant },
      order.cancellationReason,
    );

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

export async function rateOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { restaurantRating, restaurantReview, courierRating, courierReview } = req.body;

    const order = await rateOrderOperation({
      orderId,
      customerUserId: req.user._id,
      restaurantRating,
      restaurantReview,
      courierRating,
      courierReview,
    });

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}
