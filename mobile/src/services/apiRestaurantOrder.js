import { api } from "@/api/client";

export async function getRestaurantOrders({ status, page = 1, limit = 20, search } = {}) {
  const { data } = await api.get("/restaurant/orders", {
    params: { status, page, limit, search },
  });
  // { status, data: { orders, counts, pagination } }
  return data.data;
}

export async function getRestaurantOrderById(orderId) {
  const { data } = await api.get(`/restaurant/orders/${orderId}`);
  return data.data?.order ?? data.data;
}

export async function confirmOrder(orderId, estimatedPreparationTime) {
  const { data } = await api.patch(`/restaurant/orders/${orderId}/confirm`, {
    estimatedPreparationTime,
  });
  return data;
}

export async function rejectOrder(orderId, reason) {
  const { data } = await api.patch(`/restaurant/orders/${orderId}/reject`, { reason });
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await api.patch(`/restaurant/orders/${orderId}/status`, { status });
  return data;
}

export async function cancelRestaurantOrder(orderId, reason) {
  const { data } = await api.patch(`/restaurant/orders/${orderId}/cancel`, { reason });
  return data;
}
