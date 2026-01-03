import { Router } from "express";
import {
  addToCart,
  clearCart,
  getCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "../controllers/cartController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protectedRoute);

router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:menuItemId", updateCartItemQuantity);
router.delete("/items/:menuItemId", removeItemFromCart);
router.delete("/", clearCart);

export default router;
