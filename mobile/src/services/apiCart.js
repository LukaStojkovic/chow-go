import { api } from "@/api/client";

export async function getCart() {
  const { data } = await api.get("/cart");
  return data;
}

export async function addToCart(menuItemId, quantity = 1, specialInstructions) {
  const { data } = await api.post("/cart/items", {
    menuItemId,
    quantity,
    specialInstructions,
  });
  return data;
}

export async function updateCartItemQuantity(menuItemId, quantity, specialInstructions) {
  const { data } = await api.patch(`/cart/items/${menuItemId}`, {
    quantity,
    specialInstructions,
  });
  return data;
}

export async function removeItemFromCart(menuItemId) {
  const { data } = await api.delete(`/cart/items/${menuItemId}`);
  return data;
}

export async function clearCart() {
  const { data } = await api.delete("/cart");
  return data;
}
