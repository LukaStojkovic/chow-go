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
