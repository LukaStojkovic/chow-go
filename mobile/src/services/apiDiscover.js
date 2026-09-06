import { api } from "@/api/client";

export async function getDiscoverFeed({ lat, lon, category, page = 1, limit = 12 }) {
  const { data } = await api.get("/discover/feed", {
    params: { lat, lon, category, page, limit },
  });
  return { items: data.data, hasMore: Boolean(data.hasMore), page };
}

export async function getPopularItems({ lat, lon }) {
  const { data } = await api.get("/discover/popular", { params: { lat, lon } });
  return data.data;
}

export async function getPromotions({ lat, lon }) {
  const { data } = await api.get("/discover/promotions", { params: { lat, lon } });
  return { deals: data.deals, newRestaurants: data.newRestaurants };
}

export async function searchDiscover({ lat, lon, query }) {
  const { data } = await api.get("/discover/search", { params: { lat, lon, query } });
  return { restaurants: data.restaurants, items: data.items };
}
