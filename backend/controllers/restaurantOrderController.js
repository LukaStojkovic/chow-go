import * as orderService from "../services/restaurantOrder.service.js";

export async function getRestaurantOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const restaurant = await orderService.getRestaurantByUserId(req.user._id);

    const result = await orderService.getOrdersByRestaurant({
      restaurantId: restaurant._id,
      statusFilter: status,
      page,
      limit,
      search,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { estimatedPreparationTime } = req.body;

    const restaurant = await orderService.getRestaurantByUserId(req.user._id);

    const order = await orderService.confirmOrderOperation(
      orderId,
      restaurant._id,
      estimatedPreparationTime,
    );

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

    const restaurant = await orderService.getRestaurantByUserId(req.user._id);

    const order = await orderService.rejectOrderOperation(
      orderId,
      restaurant._id,
      reason,
    );

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

    const restaurant = await orderService.getRestaurantByUserId(req.user._id);

    const order = await orderService.updateOrderStatusOperation(
      orderId,
      restaurant._id,
      status,
    );

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

    const restaurant = await orderService.getRestaurantByUserId(req.user._id);

    const order = await orderService.getOrderById(orderId, restaurant._id);

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

    const restaurant = await orderService.getRestaurantByUserId(req.user._id);

    const order = await orderService.cancelOrderOperation(
      orderId,
      restaurant._id,
      reason,
    );

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
}
