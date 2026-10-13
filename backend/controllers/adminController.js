import * as adminService from "../services/admin.service.js";
import * as promoService from "../services/promoCode.service.js";
import * as collectionService from "../services/collection.service.js";
import * as reportService from "../services/sellerReports.service.js";

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

export async function listCollections(req, res) {
  res.status(200).json({ data: await collectionService.listAdminCollections(req.query) });
}

export async function getCollection(req, res) {
  res.status(200).json({ data: await collectionService.getAdminCollection(req.params.collectionId) });
}

export async function createCollection(req, res) {
  const data = await collectionService.createCollection({ actor: req.user, input: req.body, requestId: req.id });
  res.status(201).json({ data });
}

export async function updateCollection(req, res) {
  const data = await collectionService.updateCollection({
    actor: req.user,
    id: req.params.collectionId,
    input: req.body,
    requestId: req.id,
  });
  res.status(200).json({ data });
}

export async function setCollectionStatus(req, res) {
  const data = await collectionService.setCollectionStatus({
    actor: req.user,
    id: req.params.collectionId,
    action: req.body?.action,
    requestId: req.id,
  });
  res.status(200).json({ data });
}

export async function reorderCollections(req, res) {
  const data = await collectionService.reorderCollections({ actor: req.user, ids: req.body?.ids, requestId: req.id });
  res.status(200).json({ data });
}

export async function previewCollection(req, res) {
  res.status(200).json({ data: await collectionService.previewCollection({ input: req.body, query: req.query }) });
}

export async function searchCollectionPins(req, res) {
  const data = req.query.ids
    ? await collectionService.describePins({ kind: req.query.kind, ids: req.query.ids })
    : await collectionService.searchPinCandidates({ kind: req.query.kind, q: req.query.q });
  res.status(200).json({ data });
}

export async function listPayouts(req, res) {
  res.status(200).json({ data: await reportService.listAdminPayouts(req.query) });
}

export async function markPayoutPaid(req, res) {
  const data = await reportService.markPayoutPaid({ actor: req.user, input: req.body, requestId: req.id });
  res.status(201).json({ data });
}

export async function voidPayout(req, res) {
  const data = await reportService.voidPayout({
    actor: req.user,
    payoutId: req.params.payoutId,
    reason: req.body?.reason,
    requestId: req.id,
  });
  res.status(200).json({ data });
}
