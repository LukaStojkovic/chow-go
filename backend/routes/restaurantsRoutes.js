import { Router } from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  createMenuItem,
  deleteMenuItem,
  editMenuItem,
  getRestaurantMenuItems,
  getRestaurantInformations,
  getRestaurantMenuByCategories,
} from "../controllers/restaurantController.js";
import { createUpload } from "../middlewares/upload.js";

const router = Router();
const uploadMenuItemImage = createUpload("menuItems");
router.use(protectedRoute);

router.post(
  "/:restaurantId/menu",
  uploadMenuItemImage.array("images", 6),
  createMenuItem
);
router.put(
  "/:restaurantId/menu/:menuItemId",
  uploadMenuItemImage.array("images", 6),
  editMenuItem
);

router.get("/:restaurantId", getRestaurantInformations);
router.get("/:restaurantId/menu-items", getRestaurantMenuItems);
router.get("/:restaurantId/menu", getRestaurantMenuByCategories);
router.delete("/:restaurantId/menu/:menuItemId", deleteMenuItem);

export default router;
