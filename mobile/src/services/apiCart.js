import { api } from "@/api/client";

const linePath = (lineId) => `/cart/items/${encodeURIComponent(String(lineId))}`;

export async function getCart() {
  const { data } = await api.get("/cart");
  return data;
}

export async function addToCart(menuItemId, quantity = 1, specialInstructions, options) {
  const { data } = await api.post("/cart/items", {
    menuItemId,
    quantity,
    specialInstructions,
    ...(options?.length ? { options } : {}),
  });
  return data;
}

export async function updateCartItemQuantity(lineId, quantity, specialInstructions) {
  const { data } = await api.patch(linePath(lineId), {
    quantity,
    specialInstructions,
  });
  return data;
}

export async function removeItemFromCart(lineId) {
  const { data } = await api.delete(linePath(lineId));
  return data;
}

export async function clearCart() {
  const { data } = await api.delete("/cart");
  return data;
}
