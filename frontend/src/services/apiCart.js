import { axiosInstance } from "@/lib/axios";
import { t } from "@chowgo/shared/i18n";

const handleApiError = (err) => {
  if (err.response?.data?.message) {
    const error = new Error(err.response.data.message);
    error.code = err.response.data.code;
    throw error;
  }
  throw new Error(t("common:error.generic"));
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

export async function addToCart(menuItemId, quantity, specialInstructions, options) {
  try {
    const res = await axiosInstance.post(`/cart/items`, {
      menuItemId,
      quantity,
      specialInstructions,
      ...(options?.length ? { options } : {}),
    });
    return res.data;
  } catch (err) {
    console.error("Error adding to cart:", err);
    handleApiError(err);
  }
}

export async function updateCartItemQuantity(lineId, quantity, specialInstructions) {
  try {
    const res = await axiosInstance.patch(`/cart/items/${encodeURIComponent(lineId)}`, {
      quantity,
      specialInstructions,
    });
    return res.data;
  } catch (err) {
    console.error("Error updating quantity:", err);
    handleApiError(err);
  }
}

export async function removeItemFromCart(lineId) {
  try {
    const res = await axiosInstance.delete(`/cart/items/${encodeURIComponent(lineId)}`);
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
