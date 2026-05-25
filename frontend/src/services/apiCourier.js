import { axiosInstance } from "@/lib/axios";

export async function getCourierAvailableOrders(limit) {
  const res = await axiosInstance.get(`/courier/available`, {
    params: { limit },
  });
  return res.data;
}
export async function getCourierOrders(status) {
  const params = status ? { status } : {};
  const res = await axiosInstance.get(`/courier/my-orders`, { params });
  return res.data;
}

export async function acceptOrder(orderId) {
  const res = await axiosInstance.patch(`/courier/${orderId}/accept`);
  return res.data;
}

export async function markAsPickedUp(orderId) {
  const res = await axiosInstance.patch(`/courier/${orderId}/picked-up`);
  return res.data;
}

export async function markInTransit(orderId) {
  const res = await axiosInstance.patch(`/courier/${orderId}/in-transit`);
  return res.data;
}

export async function markDelivered(orderId) {
  const res = await axiosInstance.patch(`/courier/${orderId}/delivered`);
  return res.data;
}

export async function changeCourierDutyStatus(isAvailable) {
  const res = await axiosInstance.patch(`/courier/duty-status`, {
    isAvailable,
  });
  return res.data;
}
