import { Router } from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  createMenuItem,
  deleteMenuItem,
  editMenuItem,
  getRestaurantMenuItems,
  getRestaurantInformations,
  getRestaurantMenuByCategories,
  updateRestaurant,
  getRestaurantStats,
} from "../controllers/restaurantController.js";
import { createUpload } from "../middlewares/upload.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();
const uploadMenuItemImage = createUpload("menuItems");
const uploadRestaurantImage = createUpload("restaurants");
router.use(protectedRoute);

router.put(
  "/update",
  uploadRestaurantImage.single("profilePicture"),
  updateRestaurant,
);

router.post(
  "/:restaurantId/menu",
  uploadMenuItemImage.array("images", 6),
  createMenuItem,
);
router.put(
  "/:restaurantId/menu/:menuItemId",
  uploadMenuItemImage.array("images", 6),
  editMenuItem,
);

router.get("/:restaurantId", getRestaurantInformations);
router.get("/:restaurantId/menu-items", getRestaurantMenuItems);
router.get("/:restaurantId/menu", getRestaurantMenuByCategories);
router.delete("/:restaurantId/menu/:menuItemId", deleteMenuItem);
router.get("/:restaurantId/stats", isSellerMiddleware, getRestaurantStats);

export default router;
