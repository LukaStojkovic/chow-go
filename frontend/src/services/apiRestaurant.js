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

export async function getMenuItems(
  restaurantId,
  {
    page = 1,
    limit = 12,
    search = "",
    category = "",
    minPrice = "",
    maxPrice = "",
    available = "",
  } = {}
) {
  if (!restaurantId) return { menuItems: [], pagination: {} };

  try {
    const { data } = await axiosInstance.get(
      `/restaurants/${restaurantId}/menu-items`,
      {
        params: {
          page,
          limit,
          search,
          category,
          minPrice,
          maxPrice,
          available,
        },
      }
    );

    return {
      menuItems: data?.data?.menuItems || [],
      pagination: data?.data?.pagination || {},
    };
  } catch (error) {
    console.error("Failed to fetch menu items:", error);
    return { menuItems: [], pagination: {} };
  }
}

export async function getRestaurantMenuByCategories(restaurantId) {
  if (!restaurantId) return { menu: [] };
  try {
    const res = await axiosInstance.get(`/restaurants/${restaurantId}/menu`);

    return res.data.menu;
  } catch (error) {
    console.error("Failed to fetch restaurant menu by categories:", error);
    return { menu: [] };
  }
}

export async function updateMenuItem(restaurantId, menuItemId, menuItemData) {
  try {
    const formData = new FormData();

    formData.append("name", menuItemData.name);
    formData.append("category", menuItemData.category);
    formData.append("price", menuItemData.price);
    formData.append("available", menuItemData.available);
    if (menuItemData.description) {
      formData.append("description", menuItemData.description);
    }

    if (menuItemData.existingImages && menuItemData.existingImages.length > 0) {
      menuItemData.existingImages.forEach((url) => {
        formData.append("existingImages", url);
      });
    }

    const images = Array.isArray(menuItemData.images)
      ? menuItemData.images
      : [];
    images.forEach((image) => {
      formData.append("images", image);
    });

    const res = await axiosInstance.put(
      `/restaurants/${restaurantId}/menu/${menuItemId}`,
      formData
    );

    return res.data;
  } catch (err) {
    console.error("Error updating menu item:", err);
    throw err;
  }
}

export async function deleteMenuItem(restaurantId, menuItemId) {
  try {
    const res = await axiosInstance.delete(
      `/restaurants/${restaurantId}/menu/${menuItemId}`
    );

    return res.data;
  } catch (err) {
    console.error("Error deleting menu item:", err);
    throw err;
  }
}

export async function getRestaurantInformations(restaurantId) {
  try {
    const res = await axiosInstance.get(`/restaurants/${restaurantId}`);
    return res.data.data;
  } catch (err) {
    console.error("Error fetching restaurant informations:", err);
    throw err;
  }
}
