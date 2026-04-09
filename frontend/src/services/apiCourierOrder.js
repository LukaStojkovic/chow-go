import { axiosInstance } from "@/lib/axios";

export async function getCourierAvailableOrders({ page = 1, limit = 20 } = {}) {
  const { data } = await axiosInstance.get("/courier/orders/available", {
    params: { page, limit },
  });
  return data;
}

export async function getCourierOrders({ status, page = 1, limit = 20 } = {}) {
  const { data } = await axiosInstance.get("/courier/orders/my-orders", {
    params: { status, page, limit },
  });
  return data;
}

export async function acceptCourierOrder(orderId) {
  const { data } = await axiosInstance.patch(`/courier/orders/${orderId}/accept`);
  return data;
}

export async function cancelCourierAssignedOrder(orderId, reason) {
  const { data } = await axiosInstance.patch(`/courier/orders/${orderId}/cancel`, {
    reason,
  });
  return data;
}

export async function markCourierPickedUp(orderId) {
  const { data } = await axiosInstance.patch(
    `/courier/orders/${orderId}/picked-up`,
  );
  return data;
}

export async function markCourierInTransit(orderId) {
  const { data } = await axiosInstance.patch(
    `/courier/orders/${orderId}/in-transit`,
  );
  return data;
}

export async function markCourierDelivered(orderId) {
  const { data } = await axiosInstance.patch(
    `/courier/orders/${orderId}/delivered`,
  );
  return data;
}

