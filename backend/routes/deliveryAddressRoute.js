import { Router } from "express";

import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  addNewDeliveryAddress,
  getDeliveryAddresses,
  setDefaultAddress,
  deleteDeliveryAddress,
} from "../controllers/deliveryAddressController.js";

const router = Router();

router.use(protectedRoute);

router.get("/", getDeliveryAddresses);
router.post("/", addNewDeliveryAddress);
router.patch("/:addressId/default", setDefaultAddress);
router.delete("/:addressId", deleteDeliveryAddress);

export default router;
