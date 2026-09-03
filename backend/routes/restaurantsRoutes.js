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
  getRestaurantAnalytics,
} from "../controllers/restaurantController.js";
import { createUpload } from "../middlewares/upload.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();
const uploadMenuItemImage = createUpload("menuItems");
const uploadRestaurantImage = createUpload("restaurants");

// Public reads. A restaurant's profile and its menu are already served without
// a token by /discover/search and /discover/feed, so gating these two added no
// protection - it only meant a visitor browsing discovery hit a wall the
// moment they opened a restaurant. Everything below `router.use` stays gated.
router.get("/:restaurantId", getRestaurantInformations);
router.get("/:restaurantId/menu", getRestaurantMenuByCategories);

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

router.get(
  "/:restaurantId/analytics",
  isSellerMiddleware,
  getRestaurantAnalytics,
);
router.get("/:restaurantId/menu-items", getRestaurantMenuItems);
router.delete(
  "/:restaurantId/menu/:menuItemId",
  isSellerMiddleware,
  deleteMenuItem,
);
router.get("/:restaurantId/stats", isSellerMiddleware, getRestaurantStats);

export default router;
