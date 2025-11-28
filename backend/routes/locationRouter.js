import { Router } from "express";
import { getLocation } from "../controllers/locationController.js";

const router = Router();

router.get("/get-location", getLocation);

export default router;
