import { Router } from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "../controllers/cartController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isCustomerMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Only customers order. A seller or courier placing orders could order from
// their own restaurant and rate it, or pad a courier's deliveries.
router.use(protectedRoute, isCustomerMiddleware);

router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:lineId", updateCartItemQuantity);
router.delete("/items/:lineId", removeItemFromCart);
router.delete("/", clearCart);

export default router;
