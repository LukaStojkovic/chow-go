import { Router } from "express";
import { getMenuLayout, saveMenuLayout } from "../controllers/menuLayoutController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.use(protectedRoute, isSellerMiddleware);

router.get("/", getMenuLayout);
router.put("/", saveMenuLayout);

export default router;
