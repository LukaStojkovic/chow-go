import { Router } from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  createMenuItem,
  deleteMenuItem,
  getRestaurantMenuItems,
  getRestaurantInformations,
  getRestaurantMenuByCategories,
} from "../controllers/restaurantController.js";
import { createUpload } from "../middlewares/upload.js";

const router = Router();
const uploadMenuItemImage = createUpload("menuItems");

router.post(
  "/:restaurantId/menu",
  protectedRoute,
  uploadMenuItemImage.array("images", 6),
  createMenuItem
);

router.get("/:restaurantId", protectedRoute, getRestaurantInformations);
router.get("/:restaurantId/menu-items", protectedRoute, getRestaurantMenuItems);
router.get(
  "/:restaurantId/menu",
  protectedRoute,
  getRestaurantMenuByCategories
);
router.delete(
  "/:restaurantId/menu/:menuItemId",
  protectedRoute,
  deleteMenuItem
);

export default router;
