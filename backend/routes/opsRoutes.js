import { Router } from "express";
import { opsAccess } from "../middlewares/authMiddleware.js";
import { forceCancelOrder } from "../services/orderRecovery.service.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.use(opsAccess);

// curl -X POST -H "X-Ops-Token: $OPS_TOKEN" -H "Content-Type: application/json" \
//   -d '{"reason":"courier unreachable"}' https://<host>/api/ops/orders/<id>/cancel
router.post("/orders/:orderId/cancel", async (req, res) => {
  const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 200) : "";
  const order = await forceCancelOrder(req.params.orderId, reason);
  logger.warn({ orderId: String(order._id), reason }, "Order force-cancelled by operator");
  res.status(200).json({ status: "success", data: { orderId: order._id, status: order.status } });
});

export default router;
