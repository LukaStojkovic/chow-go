import { Router } from "express";
import { deleteReply, listOwnReviews, replyToReview } from "../controllers/reviewController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isSellerMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.use(protectedRoute, isSellerMiddleware);

router.get("/", listOwnReviews);
router.put("/:orderId/reply", replyToReview);
router.delete("/:orderId/reply", deleteReply);

export default router;
