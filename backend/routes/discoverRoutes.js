import { Router } from "express";
import {
  getDiscoverFeed,
  getPopularItems,
  searchDiscover,
} from "../controllers/discoverController.js";

const router = Router();

router.get("/feed", getDiscoverFeed);
router.get("/popular", getPopularItems);
router.get("/search", searchDiscover);

export default router;
