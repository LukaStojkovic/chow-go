import { axiosInstance } from "@/lib/axios";

/**
 * Append the fields shared by creating and updating a menu item.
 *
 * Nested `promotion[...]` keys are rebuilt into an object on the server by
 * multer's append-field, the same way the weekly schedule is submitted from
 * seller settings. The block is always sent - including when the promotion is
 * off - because the backend replaces the promotion wholesale, and omitting it
 * would make "end this deal" impossible to express.
 */
function appendMenuItemFields(formData, menuItemData) {
  formData.append("name", menuItemData.name);
  formData.append("category", menuItemData.category);
  formData.append("price", menuItemData.price);
  formData.append("available", menuItemData.available);
  if (menuItemData.description) {
    formData.append("description", menuItemData.description);
  }

  const promotion = menuItemData.promotion || {};
  formData.append("promotion[isActive]", promotion.isActive ? "true" : "false");

  if (promotion.isActive) {
    formData.append("promotion[type]", promotion.type || "percentage");
    formData.append("promotion[value]", promotion.value ?? "");
    formData.append("promotion[label]", promotion.label || "");
    // Sent only when set: an empty string is not a date, and the backend reads
    // a missing bound as "runs until switched off".
    if (promotion.startsAt) {
      formData.append("promotion[startsAt]", promotion.startsAt);
    }
    if (promotion.endsAt) {
      formData.append("promotion[endsAt]", promotion.endsAt);
    }
  }

  const images = Array.isArray(menuItemData.images) ? menuItemData.images : [];
  images.forEach((image) => {
    formData.append("images", image);
  });
}

export async function createMenuItem(restaurantId, menuItemData) {
  try {
    const formData = new FormData();

    appendMenuItemFields(formData, menuItemData);

    const res = await axiosInstance.post(
      `/restaurants/${restaurantId}/menu`,
      formData,
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
  } = {},
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
      },
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

    appendMenuItemFields(formData, menuItemData);

    if (menuItemData.existingImages && menuItemData.existingImages.length > 0) {
      menuItemData.existingImages.forEach((url) => {
        formData.append("existingImages", url);
      });
    }

    const res = await axiosInstance.put(
      `/restaurants/${restaurantId}/menu/${menuItemId}`,
      formData,
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
      `/restaurants/${restaurantId}/menu/${menuItemId}`,
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

export async function getRestaurantStats(restaurantId) {
  try {
    const res = await axiosInstance.get(`/restaurants/${restaurantId}/stats`);
    return (
      res.data || {
        success: false,
        stats: {
          totalRevenue: { value: "0.00", trend: 0, isPositive: true },
          activeOrders: { value: 0, trend: 0, isPositive: true },
          totalCustomers: { value: 0, trend: 0, isPositive: true },
          avgRating: {
            value: "0.0",
            trend: "0",
            isPositive: true,
            totalReviews: 0,
          },
        },
        chartData: [],
        popularItems: [],
        recentOrders: [],
      }
    );
  } catch (err) {
    console.error("Error fetching restaurant stats:", err);
    throw err;
  }
}

export async function getRestaurantAnalytics(restaurantId) {
  try {
    const res = await axiosInstance.get(
      `/restaurants/${restaurantId}/analytics`,
    );

    return res.data;
  } catch (err) {
    console.error("Error fetching restaurant analytics:", err);
    throw err;
  }
}
