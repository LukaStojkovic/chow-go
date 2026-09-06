import { api } from "@/api/client";
import { toFormData } from "@/api/uploads";

export async function getAvailableOrders({ page = 1, limit = 20 } = {}) {
  const { data } = await api.get("/courier/available", { params: { page, limit } });
  // { status, data: { orders, geoFiltered, pagination } }
  return data.data;
}

export async function getCourierOrders({ status, page = 1, limit = 20 } = {}) {
  const { data } = await api.get("/courier/my-orders", { params: { status, page, limit } });
  return data.data;
}

export async function getCourierOrderById(orderId) {
  const { data } = await api.get(`/courier/my-orders/${orderId}`);
  return data.data?.order ?? data.data;
}

export async function getCourierOverview() {
  const { data } = await api.get("/courier/my-overview");
  return data.data.analytics;
}

export async function getCourierProfile() {
  const { data } = await api.get("/courier/profile");
  return data.data.courier;
}

export async function updateCourierProfile({ profilePicture, ...fields }) {
  const form = toFormData(fields, profilePicture ? { profilePicture: [profilePicture] } : {});
  const { data } = await api.patch("/courier/profile", form);
  return data;
}

export async function setDutyStatus(isAvailable) {
  const { data } = await api.patch("/courier/duty-status", { isAvailable });
  return data;
}

const transition = (action) => async (orderId, body) => {
  const { data } = await api.patch(`/courier/${orderId}/${action}`, body);
  return data;
};

export const acceptOrder = transition("accept");
export const releaseOrder = transition("cancel");
export const markPickedUp = transition("picked-up");
export const markInTransit = transition("in-transit");
export const markDelivered = transition("delivered");
