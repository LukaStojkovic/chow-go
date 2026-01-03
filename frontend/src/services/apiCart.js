import { axiosInstance } from "@/lib/axios";

const handleApiError = (err) => {
  if (err.response?.data?.message) {
    throw new Error(err.response.data.message);
  }
  throw new Error("Something went wrong");
};

export async function getCart() {
  try {
    const res = await axiosInstance.get(`/cart`);
    return res.data;
  } catch (err) {
    console.error("Error fetching cart:", err);
    handleApiError(err);
  }
}

export async function addToCart(menuItemId, quantity) {
  try {
    const res = await axiosInstance.post(`/cart/items`, {
      menuItemId,
      quantity,
    });
    return res.data;
  } catch (err) {
    console.error("Error adding to cart:", err);
    handleApiError(err);
  }
}

export async function updateCartItemQuantity(menuItemId, quantity) {
  try {
    const res = await axiosInstance.patch(`/cart/items/${menuItemId}`, {
      quantity,
    });
    return res.data;
  } catch (err) {
    console.error("Error updating quantity:", err);
    handleApiError(err);
  }
}

export async function removeItemFromCart(menuItemId) {
  try {
    const res = await axiosInstance.delete(`/cart/items/${menuItemId}`);
    return res.data;
  } catch (err) {
    console.error("Error removing item:", err);
    handleApiError(err);
  }
}

export async function clearCart() {
  try {
    const res = await axiosInstance.delete(`/cart`);
    return res.data;
  } catch (err) {
    console.error("Error clearing cart:", err);
    handleApiError(err);
  }
}
