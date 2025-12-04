import { Router } from "express";
import {
  getLocation,
  locationPrediction,
} from "../controllers/locationController.js";

const router = Router();

router.get("/get-location", getLocation);
router.get("/location-prediction", locationPrediction);

export default router;
