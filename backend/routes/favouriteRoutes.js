import express from "express";
import { toggleFavourite, getFavourites } from "../controllers/favouriteController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protectedRoute);

router.post("/toggle", toggleFavourite);
router.get("/", getFavourites);

export default router;
