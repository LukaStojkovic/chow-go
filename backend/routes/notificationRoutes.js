import express from "express";
import {
  registerDevice,
  unregisterDevice,
} from "../controllers/notificationController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register-device", protectedRoute, registerDevice);
router.delete("/device", protectedRoute, unregisterDevice);

export default router;
