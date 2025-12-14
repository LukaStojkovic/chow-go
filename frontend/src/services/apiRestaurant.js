import { axiosInstance } from "@/lib/axios";

export async function createMenuItem(restaurantId, menuItemData) {
  try {
    const res = await axiosInstance.post(
      `/restaurant/${restaurantId}/menu`,
      menuItemData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("Error creating menu item:", err);
    throw err;
  }
}
