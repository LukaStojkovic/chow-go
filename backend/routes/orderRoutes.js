import express from "express";
import {
  cancelOrder,
  createOrder,
  getCustomerOrders,
  getOrderById,
} from "../controllers/orderController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/create", createOrder);
router.get("/my-orders", getCustomerOrders);
router.get("/:orderId", getOrderById);
router.patch("/:orderId/cancel", cancelOrder);

export default router;
