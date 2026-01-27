import express from "express";
import {
  getRestaurantOrders,
  confirmOrder,
  rejectOrder,
  updateOrderStatus,
  getRestaurantOrderById,
  cancelRestaurantOrder,
} from "../controllers/restaurantOrderController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protectedRoute, isSellerMiddleware);

router.get("/", getRestaurantOrders);

router.get("/:orderId", getRestaurantOrderById);

router.patch("/:orderId/confirm", confirmOrder);

router.patch("/:orderId/reject", rejectOrder);

router.patch("/:orderId/status", updateOrderStatus);

router.patch("/:orderId/cancel", cancelRestaurantOrder);

export default router;
