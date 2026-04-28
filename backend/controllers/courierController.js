import * as courierOrderService from "../services/courierOrder.service.js";
import { AppError } from "../utils/AppError.js";

export async function getAvailableOrders(req, res, next) {
  const { page = 1, limit = 20 } = req.query;

  const result = await courierOrderService.listAvailableOrders({
    courierUserId: req.user._id,
    page,
    limit,
  });

  if (!result) return next(new AppError("Something went wrong", 404));

  res.status(200).json({ status: "success", data: result });
}

export async function getCourierOrders(req, res, next) {
  const { status, page = 1, limit = 20 } = req.query;
  const courier = await courierOrderService.getCourierByUserId(req.user._id);

  const result = await courierOrderService.listCourierOrders({
    courierId: courier._id,
    status,
    page,
    limit,
  });

  if (!result) {
    return next(new AppError("Something went wrong", 404));
  }

  res.status(200).json({
    status: "success",
    data: result,
  });
}

export async function getCourierOrderById(req, res, next) {
  const { orderId } = req.params;
  const order = await courierOrderService.getCourierOrderById({
    orderId,
    courierUserId: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: { order },
  });
}

export async function acceptOrder(req, res, next) {
  const { orderId } = req.params;
  const order = await courierOrderService.acceptOrderOperation({
    orderId,
    courierUserId: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: { order },
  });
}

export async function cancelAssignedOrder(req, res, next) {
  const { orderId } = req.params;
  const { reason } = req.body;
  const order = await courierOrderService.cancelAssignedOrderOperation({
    orderId,
    courierUserId: req.user._id,
    reason,
  });

  res.status(200).json({
    status: "success",
    data: { order },
  });
}

export async function markPickedUp(req, res, next) {
  const { orderId } = req.params;
  const order = await courierOrderService.markPickedUpOperation({
    orderId,
    courierUserId: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: { order },
  });
}

export async function markInTransit(req, res, next) {
  const { orderId } = req.params;
  const order = await courierOrderService.markInTransitOperation({
    orderId,
    courierUserId: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: { order },
  });
}

export async function markDelivered(req, res, next) {
  const { orderId } = req.params;
  const order = await courierOrderService.markDeliveredOperation({
    orderId,
    courierUserId: req.user._id,
  });

  res.status(200).json({
    status: "success",
    data: { order },
  });
}
