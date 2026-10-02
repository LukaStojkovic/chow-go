import * as adminService from "../services/admin.service.js";
import * as promoService from "../services/promoCode.service.js";

const context = (req) => ({ actor: req.user, requestId: req.id, reason: req.body?.reason });

export async function getOverview(req, res) {
  res.status(200).json({ data: await adminService.getOverview() });
}

export async function listRestaurants(req, res) {
  res.status(200).json(await adminService.listRestaurants(req.query));
}

export async function setRestaurantStatus(req, res) {
  const data = await adminService.setRestaurantStatus({
    ...context(req),
    restaurantId: req.params.restaurantId,
    action: req.params.action,
  });
  res.status(200).json({ data });
}

export async function listCouriers(req, res) {
  res.status(200).json(await adminService.listCouriers(req.query));
}

export async function setCourierVerification(req, res) {
  const data = await adminService.setCourierVerification({
    ...context(req),
    courierId: req.params.courierId,
    status: req.body?.status,
  });
  res.status(200).json({ data });
}

export async function listUsers(req, res) {
  res.status(200).json(await adminService.listUsers(req.query));
}

export async function suspendUser(req, res) {
  const data = await adminService.suspendUser({ ...context(req), userId: req.params.userId });
  res.status(200).json({ data });
}

export async function unsuspendUser(req, res) {
  const data = await adminService.unsuspendUser({ ...context(req), userId: req.params.userId });
  res.status(200).json({ data });
}

export async function cancelOrder(req, res) {
  const order = await adminService.cancelOrder({ ...context(req), orderId: req.params.orderId });
  res.status(200).json({ data: { orderId: order._id, status: order.status } });
}

export async function listAudit(req, res) {
  res.status(200).json(await adminService.listAudit(req.query));
}

export async function listPromos(req, res) {
  res.status(200).json(await promoService.listAdminPromos(req.query));
}

export async function createPromo(req, res) {
  const data = await promoService.createAdminPromo({ actor: req.user, input: req.body, requestId: req.id });
  res.status(201).json({ data });
}

export async function updatePromo(req, res) {
  const data = await promoService.updateAdminPromo({
    actor: req.user,
    promoId: req.params.promoId,
    input: req.body,
    requestId: req.id,
  });
  res.status(200).json({ data });
}

export async function setPromoStatus(req, res) {
  const data = await promoService.setAdminPromoStatus({
    ...context(req),
    promoId: req.params.promoId,
    action: req.body?.action,
  });
  res.status(200).json({ data });
}

export async function promoStats(req, res) {
  res.status(200).json({ data: await promoService.adminPromoStats(req.params.promoId) });
}

export async function issueVoucher(req, res) {
  const data = await promoService.issueVoucher({
    actor: req.user,
    orderId: req.params.orderId,
    input: req.body,
    requestId: req.id,
  });
  res.status(201).json({ data });
}
