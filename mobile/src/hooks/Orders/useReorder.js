import { useCallback, useState } from "react";
import { router } from "expo-router";
import { addToCart } from "@/services/apiCart";
import { useCartStore } from "@/store/useCartStore";
import { t } from "@chowgo/shared/i18n";

import { toast } from "@/store/useToastStore";

/**
 * Re-adds every item from a past order to the basket.
 *
 * The backend enforces one restaurant per cart, so reordering while a basket
 * from somewhere else is open means discarding that basket. That is destructive
 * and unrecoverable, so the hook surfaces the conflict and the caller confirms.
 *
 * Items are added sequentially, not in parallel: they all mutate the same cart
 * document and concurrent writes drop lines.
 */
export function useReorder() {
  const { fetchCart, clearCart } = useCartStore();
  const [reorderingId, setReorderingId] = useState(null);
  const [conflict, setConflict] = useState(null);

  const run = useCallback(
    async (order) => {
      setReorderingId(String(order._id));

      const lines = (order.items ?? []).filter((line) => line.menuItem);
      let added = 0;
      const skipped = [];

      for (const line of lines) {
        const menuItemId = String(line.menuItem?._id ?? line.menuItem);
        try {
          const optionIds = (line.options ?? []).map((option) => option.optionId).filter(Boolean);
          await addToCart(menuItemId, line.quantity || 1, undefined, optionIds);
          added += 1;
        } catch {
          // A dish, or one of its options, can have been removed or switched
          // off since the original order. Skip it and report honestly rather
          // than failing everything.
          skipped.push(line.name ?? line.menuItem?.name);
        }
      }

      await fetchCart();
      setReorderingId(null);

      if (added === 0) {
        toast.error(t("basket:reorderNoneAvailable"));
        return;
      }
      if (skipped.length > 0) {
        // Serbian has three plural forms, so the count goes through the
        // catalog rather than an inline ternary.
        toast.warning(t("basket:reorderPartial", { count: added }), {
          description: t("basket:reorderUnavailable", {
            names: skipped.filter(Boolean).join(", ") || skipped.length,
          }),
        });
      } else {
        toast.success(t("basket:addedToBasket"));
      }

      router.push("/(customer)/checkout");
    },
    [fetchCart],
  );

  const reorder = useCallback(
    (order) => {
      const { items, restaurant } = useCartStore.getState();
      const target = String(order.restaurant?._id ?? order.restaurant);

      const clashes = items.length > 0 && restaurant?._id && String(restaurant._id) !== target;

      if (clashes) {
        setConflict({ order, currentRestaurantName: restaurant?.name });
        return;
      }
      run(order);
    },
    [run],
  );

  const confirmReplace = useCallback(async () => {
    if (!conflict) return;
    const { order } = conflict;
    setConflict(null);
    await clearCart();
    await run(order);
  }, [conflict, clearCart, run]);

  return {
    reorder,
    reorderingId,
    isReordering: reorderingId !== null,
    conflict,
    confirmReplace,
    cancelReplace: useCallback(() => setConflict(null), []),
  };
}
