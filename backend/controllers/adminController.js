import * as adminService from "../services/admin.service.js";

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
