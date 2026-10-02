import { axiosInstance } from "@/lib/axios";

export async function validatePromoCode({ code, restaurantId }) {
  const res = await axiosInstance.post("/promo/validate", { code, restaurantId });
  return res.data.data;
}

export async function getMyVouchers() {
  const res = await axiosInstance.get("/promo/mine");
  return res.data.data.vouchers;
}

export async function getSellerPromoCodes(params) {
  const res = await axiosInstance.get("/restaurant/promo-codes", { params });
  return res.data;
}

export async function createSellerPromoCode(input) {
  const res = await axiosInstance.post("/restaurant/promo-codes", input);
  return res.data.data;
}

export async function updateSellerPromoCode({ id, ...input }) {
  const res = await axiosInstance.patch(`/restaurant/promo-codes/${id}`, input);
  return res.data.data;
}

export async function setSellerPromoStatus({ id, action }) {
  const res = await axiosInstance.post(`/restaurant/promo-codes/${id}/status`, { action });
  return res.data.data;
}

export async function getSellerPromoStats(id) {
  const res = await axiosInstance.get(`/restaurant/promo-codes/${id}/stats`);
  return res.data.data;
}
