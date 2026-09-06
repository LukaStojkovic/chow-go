/**
 * The basket, as a side panel.
 *
 * Quantity edits are optimistic and debounced - the store is updated
 * immediately so the number and the total move under the customer's finger,
 * and the server call is coalesced 300ms later. A failed sync refetches the
 * authoritative cart rather than leaving the two out of step.
 *
 * Removals are undoable: the line is taken out at once and the toast holds the
 * restore action, so nobody loses an item to a mis-tap.
 */

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
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

/**
 * Apply a quantity change to the local store straight away.
 * Kept outside the component so it is not re-created every render.
 *
 * @param {string} menuItemId
 * @param {number} quantity
 */
function applyOptimisticQuantity(menuItemId, quantity) {
  useCartStore.setState((state) => {
    const items =
      quantity <= 0
        ? state.items.filter((item) => (item.menuItem._id || item.menuItem.id) !== menuItemId)
        : state.items.map((item) =>
            (item.menuItem._id || item.menuItem.id) === menuItemId
              ? { ...item, quantity }
              : item,
          );

    return {
      items,
      totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };
  });
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */
export function BasketPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const {
    items,
    totalPrice,
    restaurant,
    isLoading,
    fetchCart,
    updateItemQuantity,
    removeItem,
    addItem,
  } = useCartStore();

  useEffect(() => {
    if (isOpen && authUser) fetchCart();
  }, [isOpen, authUser, fetchCart]);

  const syncQuantity = useDebouncedCallback((menuItemId, quantity) => {
    const request =
      quantity > 0 ? updateItemQuantity(menuItemId, quantity) : removeItem(menuItemId);
    Promise.resolve(request).catch(() => fetchCart());
  }, 300);

  const lines = toBasketLines(items);
  const pricing = buildPriceBreakdown({ subtotal: totalPrice });

  const handleQuantityChange = (menuItemId, quantity) => {
    applyOptimisticQuantity(menuItemId, quantity);
    syncQuantity(menuItemId, quantity);
  };

  const handleRemove = (line) => {
    applyOptimisticQuantity(line.id, 0);
    syncQuantity(line.id, 0);

    toast(`${line.name} removed`, {
      action: {
        label: "Undo",
        onClick: () => {
          // Cancel the pending delete before re-adding, or the debounced call
          // lands after the restore and removes it again.
          syncQuantity.cancel();
          addItem(line.id, line.quantity);
        },
      },
    });
  };

  const isEmpty = lines.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border border-b px-4 py-3 sm:px-5">
          <SheetTitle className="text-h2">Your basket</SheetTitle>
          <SheetDescription className="sr-only">
            Review and edit the items in your basket before checking out.
          </SheetDescription>
        </SheetHeader>

        {isLoading && isEmpty ? (
          <div className="flex-1 space-y-4 p-4 sm:p-5" aria-busy="true">
            <span className="sr-only" role="status">
              Loading your basket
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
              title="Your basket is empty"
              description="Add something from a restaurant near you and it will show up here."
              action={
                <Button
                  onClick={() => {
                    onClose();
                    navigate("/discovery");
                  }}
                >
                  Browse restaurants
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
                      View menu
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
                  Estimated delivery {restaurant.estimatedDeliveryTime}
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
                <span>Continue to checkout</span>
                <span className="tabular ml-auto flex items-center gap-2">
                  {formatPrice(pricing.total)}
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
