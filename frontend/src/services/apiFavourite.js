import { axiosInstance } from "@/lib/axios";

export async function getFavourites() {
  try {
    const { data } = await axiosInstance.get("/favourites");
    return data;
  } catch (error) {
    console.error("Failed to fetch favourites:", error);
    throw error;
  }
}

export async function toggleFavourite(restaurantId) {
  try {
    const { data } = await axiosInstance.post("/favourites/toggle", {
      restaurantId,
    });
    return data;
  } catch (error) {
    console.error("Failed to toggle favourite:", error);
    throw error;
  }
}
