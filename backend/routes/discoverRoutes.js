import { Router } from "express";
import {
  getDiscoverFeed,
  getPopularItems,
  getPromotions,
  searchDiscover,
  listCollections,
  getCollection,
  suggestSearch,
  trendingSearches,
} from "../controllers/discoverController.js";

import { searchLimiter, suggestLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.get("/feed", getDiscoverFeed);
router.get("/popular", getPopularItems);
router.get("/promotions", getPromotions);
router.get("/collections", listCollections);
router.get("/collections/:slug", getCollection);
router.get("/search", searchLimiter, searchDiscover);
router.get("/search/suggest", suggestLimiter, suggestSearch);
router.get("/search/trending", searchLimiter, trendingSearches);

export default router;
