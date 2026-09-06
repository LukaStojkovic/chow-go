import { Router } from "express";
import {
  getDiscoverFeed,
  getPopularItems,
  getPromotions,
  searchDiscover,
} from "../controllers/discoverController.js";

import { searchLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.get("/feed", getDiscoverFeed);
router.get("/popular", getPopularItems);
router.get("/promotions", getPromotions);
router.get("/search", searchLimiter, searchDiscover);

export default router;
