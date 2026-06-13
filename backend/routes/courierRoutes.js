import { Router } from "express";
import { isCourierMiddleware } from "../middlewares/roleMiddleware.js";
import { createUpload } from "../middlewares/upload.js";
import {
  acceptOrder,
  cancelAssignedOrder,
  changeCourierDutyStatus,
  getAvailableOrders,
  getCourierAnaytics,
  getCourierOrderById,
  getCourierOrders,
  getCourierProfile,
  markDelivered,
  markInTransit,
  markPickedUp,
  updateCourierProfile,
} from "../controllers/courierController.js";

import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = Router();
const uploadCourier = createUpload("couriers");

router.use(protectedRoute, isCourierMiddleware);

router.get("/available", getAvailableOrders);
router.get("/my-orders", getCourierOrders);
router.get("/my-orders/:orderId", getCourierOrderById);
router.get("/my-overview", getCourierAnaytics);
router.get("/profile", getCourierProfile);
router.patch(
  "/profile",
  uploadCourier.single("profilePicture"),
  updateCourierProfile,
);
router.patch("/duty-status", changeCourierDutyStatus);

router.patch("/:orderId/accept", acceptOrder);
router.patch("/:orderId/cancel", cancelAssignedOrder);
router.patch("/:orderId/picked-up", markPickedUp);
router.patch("/:orderId/in-transit", markInTransit);
router.patch("/:orderId/delivered", markDelivered);

export default router;
