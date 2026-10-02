import { Router } from "express";
import * as promo from "../controllers/promoCodeController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.use(protectedRoute, isSellerMiddleware);

router.get("/", promo.listSellerPromos);
router.post("/", promo.createSellerPromo);
router.patch("/:promoId", promo.updateSellerPromo);
router.post("/:promoId/status", promo.setSellerPromoStatus);
router.get("/:promoId/stats", promo.sellerPromoStats);

export default router;
