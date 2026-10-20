import { api } from "@/api/client";

export async function getRestaurantStatus() {
  const { data } = await api.get("/restaurant/status");
  return data.data;
}

export async function setRestaurantStatus(body) {
  const { data } = await api.post("/restaurant/status", body);
  return data.data;
}
