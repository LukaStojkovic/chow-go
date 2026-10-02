import { Router } from "express";
import * as promo from "../controllers/promoCodeController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isCustomerMiddleware } from "../middlewares/roleMiddleware.js";
import { promoLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.use(protectedRoute, isCustomerMiddleware);

router.post("/validate", promoLimiter, promo.validatePromo);
router.get("/mine", promo.listMyVouchers);

export default router;
