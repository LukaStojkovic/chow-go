import { Router } from "express";
import { isCourierMiddleware } from "../middlewares/roleMiddleware.js";
import {
  acceptOrder,
  cancelAssignedOrder,
  getAvailableOrders,
  getCourierOrderById,
  getCourierOrders,
  markDelivered,
  markInTransit,
  markPickedUp,
} from "../controllers/courierController.js";

import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protectedRoute, isCourierMiddleware);

router.get("/available", getAvailableOrders);
router.get("/my-orders", getCourierOrders);
router.get("/my-orders/:orderId", getCourierOrderById);

router.patch("/:orderId/accept", acceptOrder);
router.patch("/:orderId/cancel", cancelAssignedOrder);
router.patch("/:orderId/picked-up", markPickedUp);
router.patch("/:orderId/in-transit", markInTransit);
router.patch("/:orderId/delivered", markDelivered);

export default router;
