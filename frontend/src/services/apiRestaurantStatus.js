import { axiosInstance } from "@/lib/axios";

export async function getRestaurantStatus() {
  const res = await axiosInstance.get("/restaurant/status");
  return res.data.data;
}

export async function setRestaurantStatus(body) {
  const res = await axiosInstance.post("/restaurant/status", body);
  return res.data.data;
}
