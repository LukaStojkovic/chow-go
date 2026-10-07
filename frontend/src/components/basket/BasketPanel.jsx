/**
 * The basket, as a side panel.
 *
 * Quantity edits are optimistic and debounced - the store is updated
 * immediately so the number and the total move under the customer's finger,
 * and each line's server call is coalesced 300ms later. A failed sync refetches the
 * authoritative cart rather than leaving the two out of step.
 *
 * Removals are undoable: the line is taken out at once and the toast holds the
 * restore action, so nobody loses an item to a mis-tap.
 */

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Clock, ShoppingBag, Store } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { toBasketLines } from "@chowgo/shared/adapters/menu";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import useCartStore from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/SmartImage";
import { EmptyState } from "@/components/common/StateViews";
import { BasketLine } from "./BasketLine";
import { FeeBreakdown } from "./FeeBreakdown";
import { lineTotal, sumMoney } from "@chowgo/shared/money";

const rawLineId = (item) =>
  String(item.lineId || item.menuItem?._id || item.menuItem?.id || item.menuItem);

/**
 * Apply a quantity change to the local store straight away.
 * Kept outside the component so it is not re-created every render.
 *
 * @param {string} lineId
 * @param {number} quantity
 */
function applyOptimisticQuantity(lineId, quantity) {
  useCartStore.setState((state) => {
    const items =
      quantity <= 0
        ? state.items.filter((item) => rawLineId(item) !== lineId)
        : state.items.map((item) => (rawLineId(item) === lineId ? { ...item, quantity } : item));

    return {
      items,
      totalPrice: sumMoney(...items.map((item) => lineTotal(item.price, item.quantity))),
    };
  });
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */
function sendQuantity(pending, lineId, quantity) {
  pending.delete(lineId);
  const { updateItemQuantity, removeItem, fetchCart } = useCartStore.getState();
  const request = quantity > 0 ? updateItemQuantity(lineId, quantity) : removeItem(lineId);
  Promise.resolve(request).catch(() => fetchCart());
}

export function BasketPanel({ isOpen, onClose }) {
  const { t } = useTranslation(["basket", "common", "restaurant"]);
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const {
    items,
    totalPrice,
    restaurant,
    isLoading,
    fetchCart,
    addItem,
  } = useCartStore();

  useEffect(() => {
    if (isOpen && authUser) fetchCart();
  }, [isOpen, authUser, fetchCart]);

  // One timer per line: a shared debounce let a tap on a second line cancel
  // the first line's pending sync.
  const pendingSyncs = useRef(new Map());
  const syncQuantity = (lineId, quantity) => {
    clearTimeout(pendingSyncs.current.get(lineId)?.timer);
    const timer = setTimeout(() => sendQuantity(pendingSyncs.current, lineId, quantity), 300);
    pendingSyncs.current.set(lineId, { timer, quantity });
  };
  const cancelSync = (lineId) => {
    clearTimeout(pendingSyncs.current.get(lineId)?.timer);
    pendingSyncs.current.delete(lineId);
  };

  // Closing the panel inside the 300ms window still sends the change.
  useEffect(() => {
    const pending = pendingSyncs.current;
    return () => {
      for (const [lineId, { timer, quantity }] of pending) {
        clearTimeout(timer);
        sendQuantity(pending, lineId, quantity);
      }
    };
  }, []);

  const lines = toBasketLines(items);
  const pricing = buildPriceBreakdown({ subtotal: totalPrice, currency: restaurant?.currency });

  const handleQuantityChange = (lineId, quantity) => {
    applyOptimisticQuantity(lineId, quantity);
    syncQuantity(lineId, quantity);
  };

  const handleRemove = (line) => {
    applyOptimisticQuantity(line.id, 0);
    syncQuantity(line.id, 0);

    toast(t("basket:line.removed", { name: line.name }), {
      action: {
        label: t("common:actions.undo"),
        onClick: () => {
          // Cancel the pending delete before re-adding, or the debounced call
          // lands after the restore and removes it again.
          cancelSync(line.id);
          addItem(
            line.menuItemId,
            line.quantity,
            line.notes || undefined,
            line.options.map((option) => option.id),
          );
        },
      },
    });
  };

  const isEmpty = lines.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border border-b px-4 py-3 sm:px-5">
          <SheetTitle className="text-h2">{t("title")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("panelDescription")}
          </SheetDescription>
        </SheetHeader>

        {isLoading && isEmpty ? (
          <div className="flex-1 space-y-4 p-4 sm:p-5" aria-busy="true">
            <span className="sr-only" role="status">
              {t("loading")}
            </span>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-16 rounded-sm" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-9 w-28 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={ShoppingBag}
              title={t("empty.title")}
              description={t("empty.description")}
              action={
                <Button
                  onClick={() => {
                    onClose();
                    navigate("/discovery");
                  }}
                >
                  {t("empty.action")}
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-5">
              {restaurant && (
                <div className="border-border flex items-center gap-3 border-b py-3">
                  <Avatar src={restaurant.profilePicture} name={restaurant.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-label text-foreground truncate">{restaurant.name}</p>
                    <Link
                      to={`/restaurant/${restaurant._id}`}
                      onClick={onClose}
                      className="text-body-sm text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      <Store className="size-3.5" aria-hidden="true" />
                      {t("viewMenu")}
                    </Link>
                  </div>
                </div>
              )}

              <ul className="divide-border divide-y">
                {/* `initial={false}` so opening the basket does not replay an
                    entry animation for lines that were already in it. */}
                <AnimatePresence initial={false}>
                  {lines.map((line) => (
                    <BasketLine
                      currency={pricing.currency}
                      key={line.id}
                      line={line}
                      onQuantityChange={(quantity) => handleQuantityChange(line.id, quantity)}
                      onRemove={() => handleRemove(line)}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              {restaurant?.estimatedDeliveryTime && (
                <p className="text-body-sm text-muted-foreground flex items-center gap-2 py-3">
                  <Clock className="size-4 shrink-0" aria-hidden="true" />
                  {t("restaurant:info.estimatedDelivery", {
                    value: restaurant.estimatedDeliveryTime,
                  })}
                </p>
              )}
            </div>

            <div className="border-border bg-card border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5">
              <FeeBreakdown pricing={pricing} className="mb-4" />

              <Button
                size="lg"
                block
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
              >
                <span>{t("goToCheckout")}</span>
                <span className="tabular ml-auto flex items-center gap-2">
                  {formatPrice(pricing.total, { currency: pricing.currency })}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
