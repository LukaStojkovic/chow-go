import { axiosInstance } from "@/lib/axios";

export async function createMenuItem(restaurantId, menuItemData) {
  try {
    const formData = new FormData();

    formData.append("name", menuItemData.name);
    formData.append("category", menuItemData.category);
    formData.append("price", menuItemData.price);
    formData.append("available", menuItemData.available);
    if (menuItemData.description) {
      formData.append("description", menuItemData.description);
    }

    const images = Array.isArray(menuItemData.images)
      ? menuItemData.images
      : [];
    images.forEach((image) => {
      formData.append("images", image);
    });

    const res = await axiosInstance.post(
      `/restaurants/${restaurantId}/menu`,
      formData
    );

    return res.data;
  } catch (err) {
    console.error("Error creating menu item:", err);
    throw err;
  }
}

export async function getMenuItems(restaurantId) {
  try {
    const res = await axiosInstance.get(`/restaurants/${restaurantId}/menu`);

    return res.data.menuItems;
  } catch (err) {
    console.error("Error fetching menu items:", err);
    throw err;
  }
}

export async function deleteMenuItems(restaurantId, menuItemId) {
  try {
    const res = await axiosInstance.delete(
      `/restaurants/${restaurantId}/menu/${menuItemId}`
    );

    return res.data;
  } catch (err) {
    console.error("Error deleting menu items:", err);
    throw err;
  }
}
