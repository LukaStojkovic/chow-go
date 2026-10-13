import { axiosInstance } from "@/lib/axios";

export async function getAdminOverview() {
  const res = await axiosInstance.get("/admin/overview");
  return res.data.data;
}

export async function getAdminList(resource, params) {
  const res = await axiosInstance.get(`/admin/${resource}`, { params });
  return res.data;
}

export async function setRestaurantStatus({ id, action, reason }) {
  const res = await axiosInstance.post(`/admin/restaurants/${id}/${action}`, { reason });
  return res.data.data;
}

export async function setCourierVerification({ id, status, reason }) {
  const res = await axiosInstance.post(`/admin/couriers/${id}/verification`, { status, reason });
  return res.data.data;
}

export async function setUserSuspension({ id, suspend, reason }) {
  const res = await axiosInstance.post(`/admin/users/${id}/${suspend ? "suspend" : "unsuspend"}`, { reason });
  return res.data.data;
}

export async function cancelOrderAsAdmin({ id, reason }) {
  const res = await axiosInstance.post(`/admin/orders/${id}/cancel`, { reason });
  return res.data.data;
}

export async function createAdminPromoCode(input) {
  const res = await axiosInstance.post("/admin/promo-codes", input);
  return res.data.data;
}

export async function updateAdminPromoCode({ id, ...input }) {
  const res = await axiosInstance.patch(`/admin/promo-codes/${id}`, input);
  return res.data.data;
}

export async function setAdminPromoStatus({ id, action, reason }) {
  const res = await axiosInstance.post(`/admin/promo-codes/${id}/status`, { action, reason });
  return res.data.data;
}

export async function getAdminPromoStats(id) {
  const res = await axiosInstance.get(`/admin/promo-codes/${id}/stats`);
  return res.data.data;
}

export async function issueOrderVoucher({ id, ...input }) {
  const res = await axiosInstance.post(`/admin/orders/${id}/voucher`, input);
  return res.data.data;
}

export async function getAdminCollections(params) {
  const res = await axiosInstance.get("/admin/collections", { params });
  return res.data.data;
}

export async function createAdminCollection(input) {
  const res = await axiosInstance.post("/admin/collections", input);
  return res.data.data;
}

export async function updateAdminCollection({ id, ...input }) {
  const res = await axiosInstance.put(`/admin/collections/${id}`, input);
  return res.data.data;
}

export async function setAdminCollectionStatus({ id, action }) {
  const res = await axiosInstance.post(`/admin/collections/${id}/status`, { action });
  return res.data.data;
}

export async function reorderAdminCollections(ids) {
  const res = await axiosInstance.put("/admin/collections/order", { ids });
  return res.data.data;
}

export async function previewAdminCollection({ lat, lon, input }) {
  const res = await axiosInstance.post("/admin/collections/preview", input, { params: { lat, lon } });
  return res.data.data;
}

export async function searchCollectionPins({ kind, q, ids }) {
  const params = ids ? { kind, ids: ids.join(",") } : { kind, q };
  const res = await axiosInstance.get("/admin/collections/pins", { params });
  return res.data.data;
}

export async function getAdminPayouts(params) {
  const res = await axiosInstance.get("/admin/payouts", { params });
  return res.data.data;
}

export async function markAdminPayoutPaid(input) {
  const res = await axiosInstance.post("/admin/payouts", input);
  return res.data.data;
}

export async function voidAdminPayout({ id, reason }) {
  const res = await axiosInstance.post(`/admin/payouts/${id}/void`, { reason });
  return res.data.data;
}
