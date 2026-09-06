import { api } from "@/api/client";

export async function getRestaurantInfo(restaurantId) {
  const { data } = await api.get(`/restaurants/${restaurantId}`);
  return data.data;
}

export async function getRestaurantMenu(restaurantId) {
  const { data } = await api.get(`/restaurants/${restaurantId}/menu`);
  return data.menu ?? [];
}
