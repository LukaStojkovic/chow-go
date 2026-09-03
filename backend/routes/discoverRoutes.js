import { Router } from "express";
import {
  getDiscoverFeed,
  getPopularItems,
  getPromotions,
  searchDiscover,
} from "../controllers/discoverController.js";

const router = Router();

router.get("/feed", getDiscoverFeed);
router.get("/popular", getPopularItems);
router.get("/promotions", getPromotions);
router.get("/search", searchDiscover);

export default router;
