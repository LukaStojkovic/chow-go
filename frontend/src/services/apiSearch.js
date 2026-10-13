import { axiosInstance } from "@/lib/axios";

export async function searchDiscover(params) {
  const res = await axiosInstance.get("/discover/search", { params });
  return res.data;
}

export async function getSearchSuggestions(params) {
  const res = await axiosInstance.get("/discover/search/suggest", { params });
  return res.data;
}

export async function getTrendingSearches(params) {
  const res = await axiosInstance.get("/discover/search/trending", { params });
  return res.data;
}
