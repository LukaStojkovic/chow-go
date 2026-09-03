import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import useCartStore from "@/store/useCartStore";
import { addToCart } from "@/services/apiCart";

/**
 * Re-add every item from a past order to the basket.
 *
 * The backend enforces one restaurant per cart and rejects a cross-restaurant
 * add outright, so reordering while a basket from somewhere else is open means
 * discarding that basket. That is destructive and unrecoverable, so it is
 * confirmed rather than done silently - the hook surfaces the conflict and the
 * caller renders the dialog.
 *
 * Items are added sequentially, not in parallel: they all mutate the same cart
 * document, and concurrent writes drop lines.
 *
 * @returns {{
 *   reorder: (order: Object) => void,
 *   isReordering: boolean,
 *   reorderingId: string | null,
 *   conflict: { order: Object } | null,
 *   confirmReplace: () => void,
 *   cancelReplace: () => void,
 * }}
 */
export function useReorder() {
  const navigate = useNavigate();
  const { fetchCart, clearCart } = useCartStore();
  const [reorderingId, setReorderingId] = useState(null);
  const [conflict, setConflict] = useState(null);

  const runReorder = useCallback(
    async (order) => {
      setReorderingId(order._id);

      const lines = (order.items || []).filter((item) => item.menuItem);
      let added = 0;
      let skipped = 0;

      for (const line of lines) {
        const menuItemId = line.menuItem?._id || line.menuItem;
        try {
          await addToCart(String(menuItemId), line.quantity || 1);
          added += 1;
        } catch {
          // A dish can have been removed from the menu or switched off since
          // the original order. Skip it and report honestly rather than
          // failing the whole reorder.
          skipped += 1;
        }
      }

      await fetchCart();
      setReorderingId(null);

      if (added === 0) {
        toast.error("None of these items are available any more.");
        return;
      }

      if (skipped > 0) {
        toast.warning(
          `${added} ${added === 1 ? "item" : "items"} added. ${skipped} no longer available.`,
        );
      } else {
        toast.success("Added to your basket");
      }

      navigate("/checkout");
    },
    [fetchCart, navigate],
  );

  const reorder = useCallback(
    (order) => {
      const { items, restaurant } = useCartStore.getState();
      const targetRestaurantId = order.restaurant?._id || order.restaurant;

      const hasConflict =
        items.length > 0 &&
        restaurant?._id &&
        String(restaurant._id) !== String(targetRestaurantId);

      if (hasConflict) {
        setConflict({ order, currentRestaurantName: restaurant?.name });
        return;
      }

      runReorder(order);
    },
    [runReorder],
  );

  const confirmReplace = useCallback(async () => {
    if (!conflict) return;
    const { order } = conflict;
    setConflict(null);
    await clearCart();
    await runReorder(order);
  }, [conflict, clearCart, runReorder]);

  const cancelReplace = useCallback(() => setConflict(null), []);

  return {
    reorder,
    isReordering: reorderingId !== null,
    reorderingId,
    conflict,
    confirmReplace,
    cancelReplace,
  };
}
