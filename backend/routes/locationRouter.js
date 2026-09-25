import { Router } from "express";
import {
  getLocation,
  getNearRestaurants,
  locationPrediction,
} from "../controllers/locationController.js";
import { geocodeLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.get("/get-location", geocodeLimiter, getLocation);
router.get("/location-prediction", geocodeLimiter, locationPrediction);
router.get("/get-near-restaurants", getNearRestaurants);

export default router;
