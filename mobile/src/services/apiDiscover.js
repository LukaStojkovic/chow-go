import { SEARCH_LIMITS } from "@chowgo/shared/search";
import { toSearchParams } from "@chowgo/shared/searchFilters";
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

export async function searchDiscover({ lat, lon, q, filters, page = 1, limit = SEARCH_LIMITS.pageSize }) {
  const { data } = await api.get("/discover/search", {
    params: { lat, lon, q, ...toSearchParams(filters), page, limit },
  });
  return {
    restaurants: data.restaurants ?? [],
    items: data.items ?? [],
    pagination: data.pagination ?? { page, limit, total: 0, hasNext: false },
  };
}

export async function suggestSearch({ lat, lon, q }) {
  const { data } = await api.get("/discover/search/suggest", { params: { lat, lon, q } });
  return data.suggestions ?? [];
}

export async function getTrendingSearches({ lat, lon }) {
  const { data } = await api.get("/discover/search/trending", { params: { lat, lon } });
  return { trending: data.trending ?? [], cuisines: data.cuisines ?? [] };
}

export async function getCollections({ lat, lon }) {
  const { data } = await api.get("/discover/collections", { params: { lat, lon } });
  return data.collections ?? [];
}

export async function getCollection({ slug, lat, lon, page = 1, limit = 20 }) {
  const { data } = await api.get(`/discover/collections/${encodeURIComponent(slug)}`, {
    params: { lat, lon, page, limit },
  });
  return {
    collection: data.collection,
    items: data.items ?? [],
    pagination: data.pagination ?? { page, limit, total: 0, hasNext: false },
  };
}
