import { axiosInstance } from "@/lib/axios";

export async function getCourierAvailableOrders() {
  try {
    const res = await axiosInstance.get(`/courier/available`);
    return res.data;
  } catch (err) {
    console.error("Error fetching courier available orders:", err);
  }
}

export async function getCourierOrders(status) {
  try {
    const params = status ? { status } : {};
    const res = await axiosInstance.get(`/courier/my-orders`, { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching courier orders:", err);
  }
}

export async function acceptOrder(orderId) {
  const res = await axiosInstance.patch(`/courier/${orderId}/accept`);
  return res.data;
}
