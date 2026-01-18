import { Router } from "express";

import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  addNewDeliveryAddress,
  getDeliveryAddresses,
} from "../controllers/deliveryAddressController.js";

const router = Router();

router.use(protectedRoute);

router.get("/", getDeliveryAddresses);
router.post("/", addNewDeliveryAddress);
// router.delete("/", deleteDeliveryAddress);

export default router;
