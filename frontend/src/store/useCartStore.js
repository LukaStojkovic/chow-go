import {
  addToCart,
  clearCart as clearCartApi,
  getCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "@/services/apiCart";
import { toast } from "sonner";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const useCartStore = create((set, get) => ({
  items: [],
  totalPrice: 0,
  restaurant: null,
  isLoading: false,

  addItem: async (menuItemId, quantity = 1) => {
    try {
      const res = await addToCart(menuItemId, quantity);
      set({ items: res.data.items, totalPrice: res.data.totalPrice });
      toast.success(`Added to cart!`);
    } catch (err) {
      toast.error(err.message || "Failed to add item");
    }
  },

  updateItemQuantity: async (menuItemId, quantity) => {
    try {
      const res = await updateCartItemQuantity(menuItemId, quantity);
      set({ items: res.data.items, totalPrice: res.data.totalPrice });
      if (quantity === 0) {
        toast.success("Item removed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update quantity");
      get().fetchCart();
    }
  },

  removeItem: async (menuItemId) => {
    try {
      const res = await removeItemFromCart(menuItemId);
      set({ items: res.data.items, totalPrice: res.data.totalPrice });
      toast.success("Item removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove item");
      get().fetchCart();
    }
  },

  clearCart: async () => {
    if (!useAuthStore.getState().authUser) {
      set({ items: [], totalPrice: 0, restaurant: null });
      return;
    }

    try {
      await clearCartApi();
      set({ items: [], totalPrice: 0, restaurant: null });
    } catch (err) {
      toast.error(err.message || "Failed to clear cart");
    }
  },

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await getCart();
      set({
        items: res.data.items,
        totalPrice: res.data.totalPrice,
        restaurant: res.data.restaurant,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load cart");
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useCartStore;
