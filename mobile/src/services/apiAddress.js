import { api } from "@/api/client";

export async function getDeliveryAddresses() {
  const { data } = await api.get("/delivery-address");
  // { status, data: [...] } - flat, unlike /favourites.
  return data.data ?? [];
}

export async function addDeliveryAddress(payload) {
  const { data } = await api.post("/delivery-address", payload);
  return data;
}

export async function updateDeliveryAddress(addressId, payload) {
  const { data } = await api.put(`/delivery-address/${addressId}`, payload);
  return data;
}

export async function setDefaultAddress(addressId) {
  const { data } = await api.patch(`/delivery-address/${addressId}/default`);
  return data;
}

export async function deleteDeliveryAddress(addressId) {
  const { data } = await api.delete(`/delivery-address/${addressId}`);
  return data;
}
