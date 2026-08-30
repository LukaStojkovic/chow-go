import { Router } from "express";

import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  addNewDeliveryAddress,
  getDeliveryAddresses,
  setDefaultAddress,
  deleteDeliveryAddress,
  updateDeliveryAddress,
} from "../controllers/deliveryAddressController.js";

const router = Router();

router.use(protectedRoute);

router.get("/", getDeliveryAddresses);
router.post("/", addNewDeliveryAddress);
router.put("/:addressId", updateDeliveryAddress);
router.patch("/:addressId/default", setDefaultAddress);
router.delete("/:addressId", deleteDeliveryAddress);

export default router;
