import { axiosInstance } from "@/lib/axios";

export async function getHomeCollections(params) {
  const res = await axiosInstance.get("/discover/collections", { params });
  return res.data;
}

export async function getCollection(slug, params) {
  const res = await axiosInstance.get(`/discover/collections/${encodeURIComponent(slug)}`, { params });
  return res.data;
}
