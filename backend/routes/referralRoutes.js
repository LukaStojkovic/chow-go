import { Router } from "express";
import { applyReferralCode, getMyReferral } from "../controllers/referralController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isCustomerMiddleware } from "../middlewares/roleMiddleware.js";
import { promoLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.use(protectedRoute, isCustomerMiddleware);

router.get("/me", getMyReferral);
router.post("/apply", promoLimiter, applyReferralCode);

export default router;
