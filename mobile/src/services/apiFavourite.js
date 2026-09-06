import { api } from "@/api/client";

export async function getFavourites() {
  const { data } = await api.get("/favourites");
  // { status, data: { favourites: [...] } } - the nesting is easy to guess
  // wrong, and guessing wrong renders an empty list rather than an error.
  return data.data?.favourites ?? [];
}

export async function toggleFavourite(restaurantId) {
  const { data } = await api.post("/favourites/toggle", { restaurantId });
  return data;
}
