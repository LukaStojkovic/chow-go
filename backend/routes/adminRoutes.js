import { Router } from "express";
import * as admin from "../controllers/adminController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isAdminMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.use(protectedRoute, isAdminMiddleware);

router.get("/overview", admin.getOverview);
router.get("/restaurants", admin.listRestaurants);
router.post("/restaurants/:restaurantId/:action", admin.setRestaurantStatus);
router.get("/couriers", admin.listCouriers);
router.post("/couriers/:courierId/verification", admin.setCourierVerification);
router.get("/users", admin.listUsers);
router.post("/users/:userId/suspend", admin.suspendUser);
router.post("/users/:userId/unsuspend", admin.unsuspendUser);
router.post("/orders/:orderId/cancel", admin.cancelOrder);
router.post("/orders/:orderId/voucher", admin.issueVoucher);
router.get("/promo-codes", admin.listPromos);
router.post("/promo-codes", admin.createPromo);
router.patch("/promo-codes/:promoId", admin.updatePromo);
router.post("/promo-codes/:promoId/status", admin.setPromoStatus);
router.get("/promo-codes/:promoId/stats", admin.promoStats);
router.get("/collections", admin.listCollections);
router.post("/collections", admin.createCollection);
router.put("/collections/order", admin.reorderCollections);
router.post("/collections/preview", admin.previewCollection);
router.get("/collections/pins", admin.searchCollectionPins);
router.get("/collections/:collectionId", admin.getCollection);
router.put("/collections/:collectionId", admin.updateCollection);
router.post("/collections/:collectionId/status", admin.setCollectionStatus);
router.get("/payouts", admin.listPayouts);
router.post("/payouts", admin.markPayoutPaid);
router.post("/payouts/:payoutId/void", admin.voidPayout);
router.get("/audit", admin.listAudit);

export default router;
