import { api } from "@/api/client";

export async function validatePromoCode({ code, restaurantId }) {
  const { data } = await api.post("/promo/validate", { code, restaurantId });
  return data.data;
}

export async function getMyVouchers() {
  const { data } = await api.get("/promo/mine");
  return data.data.vouchers;
}

export async function getSellerPromoCodes(params) {
  const { data } = await api.get("/restaurant/promo-codes", { params });
  return data;
}

export async function createSellerPromoCode(input) {
  const { data } = await api.post("/restaurant/promo-codes", input);
  return data.data;
}

export async function updateSellerPromoCode({ id, ...input }) {
  const { data } = await api.patch(`/restaurant/promo-codes/${id}`, input);
  return data.data;
}

export async function setSellerPromoStatus({ id, action }) {
  const { data } = await api.post(`/restaurant/promo-codes/${id}/status`, { action });
  return data.data;
}

export async function getSellerPromoStats(id) {
  const { data } = await api.get(`/restaurant/promo-codes/${id}/stats`);
  return data.data;
}
