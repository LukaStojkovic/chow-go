import { Router } from "express";
import {
  getLocation,
  getNearRestaurants,
  locationPrediction,
} from "../controllers/locationController.js";

const router = Router();

router.get("/get-location", getLocation);
router.get("/location-prediction", locationPrediction);
router.get("/get-near-restaurants", getNearRestaurants);

export default router;
