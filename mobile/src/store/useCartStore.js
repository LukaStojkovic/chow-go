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

/**
 * Reconcile one cart response into the store.
 *
 * The restaurant needs care. Every cart endpoint now populates it, but an
 * unpopulated response is still a bare ObjectId string, and the previous
 * version of this dropped that on the floor - which left `restaurant` null
 * after the first add of a session and sent checkout to the API with no
 * `restaurantId`, where it came back as a flat 400. Whatever arrives, the id
 * survives; the populated object is only preferred because the basket shows
 * the name.
 */
function mergeRestaurant(incoming, known, hasItems) {
  if (!incoming) return hasItems ? known : null;
  if (typeof incoming === "object") return incoming;

  // A bare id. Keep the populated document only if it is the same restaurant.
  return known?._id && String(known._id) === String(incoming) ? known : { _id: incoming };
}

// The server is authoritative: every mutation replaces local state with the
// whole cart it returns, so quantities can never drift from the backend's view.
function applyCart(set, payload) {
  const cart = payload?.data ?? payload;
  const items = cart?.items ?? [];

  set((state) => ({
    items,
    totalPrice: cart?.totalPrice ?? 0,
    restaurant: mergeRestaurant(cart?.restaurant, state.restaurant, items.length > 0),
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
