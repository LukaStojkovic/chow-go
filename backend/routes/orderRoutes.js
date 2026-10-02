import express from "express";
import {
  cancelOrder,
  createOrder,
  getCustomerOrders,
  getOrderById,
  rateOrder,
} from "../controllers/orderController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isCustomerMiddleware } from "../middlewares/roleMiddleware.js";
import { promoLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

// Only customers order. A seller or courier placing orders could order from
// their own restaurant and rate it, or pad a courier's deliveries.
router.use(protectedRoute, isCustomerMiddleware);

router.post("/create", promoLimiter, createOrder);
router.get("/my-orders", getCustomerOrders);
router.get("/:orderId", getOrderById);
router.patch("/:orderId/cancel", cancelOrder);
router.patch("/:orderId/rate", rateOrder);

export default router;
