import { create } from "zustand";
import { errorMessage } from "@/api/client";
import {
  addToCart,
  clearCart,
  getCart,
  removeItemFromCart,
  updateCartItemQuantity,
} from "@/services/apiCart";
import { useAuthStore } from "./useAuthStore";
import { toast } from "./useToastStore";

// The server is authoritative: every mutation replaces local state with the
// whole cart it returns, so quantities can never drift from the backend's view.
function applyCart(set, payload) {
  const cart = payload?.data ?? payload;
  const items = cart?.items ?? [];

  set((state) => ({
    items,
    totalPrice: cart?.totalPrice ?? 0,
    // GET /cart populates the restaurant; POST /cart/items returns a bare
    // ObjectId. Overwriting blindly would drop the name the basket displays,
    // so an unpopulated value keeps whatever is already known.
    restaurant:
      cart?.restaurant && typeof cart.restaurant === "object"
        ? cart.restaurant
        : items.length === 0
          ? null
          : state.restaurant,
  }));
}

export const useCartStore = create((set, get) => ({
  items: [],
  totalPrice: 0,
  restaurant: null,
  isLoading: false,
  /** Set when the customer adds across restaurants; the UI confirms. */
  pendingConflict: null,

  fetchCart: async () => {
    if (!useAuthStore.getState().authUser) return;
    set({ isLoading: true });
    try {
      applyCart(set, await getCart());
    } catch {
      // An empty or missing cart is not an error worth surfacing.
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (menuItemId, quantity = 1, specialInstructions) => {
    if (!useAuthStore.getState().authUser) return { status: "unauthenticated" };

    try {
      applyCart(set, await addToCart(menuItemId, quantity, specialInstructions));
      return { status: "added" };
    } catch (error) {
      // The backend rejects items from a second restaurant. That is a decision
      // for the customer to make, not an error to shout about.
      if (/one restaurant/i.test(errorMessage(error, ""))) {
        set({ pendingConflict: { menuItemId, quantity, specialInstructions } });
        return { status: "conflict" };
      }
      toast.error("Could not add this item", { description: errorMessage(error) });
      return { status: "error" };
    }
  },

  resolveConflictByReplacing: async () => {
    const conflict = get().pendingConflict;
    if (!conflict) return false;

    set({ pendingConflict: null });
    try {
      await clearCart();
      applyCart(
        set,
        await addToCart(conflict.menuItemId, conflict.quantity, conflict.specialInstructions),
      );
      return true;
    } catch (error) {
      toast.error("Could not replace your basket", { description: errorMessage(error) });
      return false;
    }
  },

  dismissConflict: () => set({ pendingConflict: null }),

  updateItemQuantity: async (menuItemId, quantity, specialInstructions) => {
    if (quantity <= 0) return get().removeItem(menuItemId);
    try {
      applyCart(set, await updateCartItemQuantity(menuItemId, quantity, specialInstructions));
    } catch (error) {
      toast.error("Could not update the basket", { description: errorMessage(error) });
    }
  },

  removeItem: async (menuItemId) => {
    try {
      applyCart(set, await removeItemFromCart(menuItemId));
    } catch (error) {
      toast.error("Could not remove the item", { description: errorMessage(error) });
    }
  },

  clearCart: async () => {
    try {
      await clearCart();
    } finally {
      set({ items: [], totalPrice: 0, restaurant: null });
    }
  },

  clearLocalCart: () => set({ items: [], totalPrice: 0, restaurant: null, pendingConflict: null }),
}));
