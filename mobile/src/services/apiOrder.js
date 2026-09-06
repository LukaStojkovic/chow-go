import { api } from "@/api/client";

export async function createOrder(payload) {
  const { data } = await api.post("/orders/create", payload);
  return data.data.order;
}

export async function getCustomerOrders({ status, page = 1, limit = 10 } = {}) {
  const { data } = await api.get("/orders/my-orders", { params: { status, page, limit } });
  return data.data;
}

export async function getOrderById(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data.data?.order ?? data.data;
}

export async function cancelOrder(orderId, reason) {
  const { data } = await api.patch(`/orders/${orderId}/cancel`, { reason });
  return data;
}

export async function rateOrder(orderId, payload) {
  const { data } = await api.patch(`/orders/${orderId}/rate`, payload);
  return data;
}
