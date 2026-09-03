import { toast } from "sonner";
import { create } from "zustand";

import {
  addToCart,
  clearCart as clearCartApi,
  getCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "@/services/apiCart";
import { useAuthStore } from "./useAuthStore";

/**
 * Mirror of the server-side cart.
 *
 * The server is authoritative - every mutation returns the whole cart and we
 * replace local state with it, so the two cannot drift. Optimistic updates for
 * quantity live in the basket panel, which reconciles by refetching on error.
 */
const useCartStore = create((set, get) => ({
  items: [],
  totalPrice: 0,
  restaurant: null,
  isLoading: false,
  /** Set when the customer tries to add across restaurants; the UI confirms. */
  pendingConflict: null,

  /**
   * @param {string} menuItemId
   * @param {number} [quantity]
   * @param {string} [specialInstructions]
   * @returns {Promise<boolean>} Whether the item made it into the basket.
   */
  addItem: async (menuItemId, quantity = 1, specialInstructions) => {
    if (!useAuthStore.getState().authUser) {
      useAuthStore.getState().openAuthModal(true);
      return false;
    }

    try {
      const res = await addToCart(menuItemId, quantity, specialInstructions);
      set({
        items: res.data.items,
        totalPrice: res.data.totalPrice,
        restaurant: res.data.restaurant,
      });
      return true;
    } catch (err) {
      // The backend rejects items from a second restaurant. That is a decision
      // for the customer to make, not an error to shout about.
      if (/one restaurant/i.test(err?.message || "")) {
        set({ pendingConflict: { menuItemId, quantity, specialInstructions } });
        return false;
      }
      toast.error(err.message || "Could not add this item. Try again.");
      return false;
    }
  },

  /** Empty the basket, then retry the add that caused the conflict. */
  resolveConflictByReplacing: async () => {
    const conflict = get().pendingConflict;
    if (!conflict) return false;

    set({ pendingConflict: null });
    await get().clearCart();
    return get().addItem(
      conflict.menuItemId,
      conflict.quantity,
      conflict.specialInstructions,
    );
  },

  dismissConflict: () => set({ pendingConflict: null }),

  updateItemQuantity: async (menuItemId, quantity, specialInstructions) => {
    try {
      const res = await updateCartItemQuantity(menuItemId, quantity, specialInstructions);
      set({ items: res.data.items, totalPrice: res.data.totalPrice });
    } catch (err) {
      toast.error(err.message || "Could not update the quantity.");
      get().fetchCart();
      throw err;
    }
  },

  removeItem: async (menuItemId) => {
    try {
      const res = await removeItemFromCart(menuItemId);
      set({ items: res.data.items, totalPrice: res.data.totalPrice });
    } catch (err) {
      toast.error(err.message || "Could not remove this item.");
      get().fetchCart();
      throw err;
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
      toast.error(err.message || "Could not empty your basket.");
    }
  },

  fetchCart: async () => {
    if (!useAuthStore.getState().authUser) {
      set({ items: [], totalPrice: 0, restaurant: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await getCart();
      set({
        items: res.data.items,
        totalPrice: res.data.totalPrice,
        restaurant: res.data.restaurant,
      });
    } catch (err) {
      // A failed cart read is not worth a toast on every page load; the basket
      // simply shows its last known contents.
      console.error("Error loading cart:", err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useCartStore;
