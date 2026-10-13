import { Router } from "express";
import { exportOrders, exportPayoutOrders, getClosures, listPayouts, setClosures } from "../controllers/sellerReportController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

// Mounted at /api/restaurant beside other routers, so the guards are per route
// rather than router.use, which would also run for paths it does not own.
const router = Router();
const seller = [protectedRoute, isSellerMiddleware];

router.get("/reports/orders.csv", ...seller, exportOrders);
router.get("/payouts", ...seller, listPayouts);
router.get("/payouts/:weekStart/orders.csv", ...seller, exportPayoutOrders);
router.get("/closures", ...seller, getClosures);
router.put("/closures", ...seller, setClosures);

export default router;
