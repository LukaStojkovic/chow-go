import { Router } from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { createMenuItem } from "../controllers/restaurantController.js";

const router = Router();

router.post("/:restaurantId/menu", protectedRoute, createMenuItem);

export default router;
