/**
 * "Order again".
 *
 * Repeat ordering is the highest-intent action a returning customer has, so it
 * sits above browsing rather than buried in order history. Renders nothing at
 * all for someone with no delivered orders - an empty "order again" rail is
 * worse than no rail.
 */

import { RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/store/useAuthStore";
import { useGetCustomerOrders } from "@/hooks/Orders/useGetCustomerOrders";
import { formatOrderDate, formatPrice } from "@/lib/format";
import { Section, Rail } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/common/SmartImage";
import { useReorder } from "@/hooks/Orders/useReorder";
import { ReplaceBasketDialog } from "@/components/basket/ReplaceBasketDialog";

function ReorderCardSkeleton() {
  return (
    <div className="bg-card border-border w-64 shrink-0 rounded-md border p-3" aria-hidden="true">
      <div className="flex items-center gap-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-3 h-9 w-full rounded-sm" />
    </div>
  );
}

export function ReorderSection() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const { orders, isLoadingOrders } = useGetCustomerOrders({
    status: "delivered",
    limit: 6,
  });
  const { reorder, isReordering, reorderingId, conflict, confirmReplace, cancelReplace } =
    useReorder();

  if (!authUser) return null;

  if (isLoadingOrders) {
    return (
      <Section title="Order again">
        <Rail aria-busy="true">
          {[0, 1, 2].map((i) => (
            <ReorderCardSkeleton key={i} />
          ))}
        </Rail>
      </Section>
    );
  }

  if (orders.length === 0) return null;

  return (
    <Section
      title="Order again"
      description="Your recent deliveries, one tap away"
      action={
        <Button variant="link" size="sm" onClick={() => navigate("/orders")}>
          All orders
        </Button>
      }
    >
      <Rail>
        {orders.map((order) => {
          const itemSummary = (order.items || [])
            .map((item) => `${item.quantity}x ${item.name}`)
            .join(", ");

          return (
            <article
              key={order._id}
              className="bg-card border-border flex w-64 shrink-0 snap-start flex-col rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                <Avatar
                  src={order.restaurant?.profilePicture}
                  name={order.restaurant?.name || "Restaurant"}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-label text-foreground truncate">
                    {order.restaurant?.name || "Restaurant"}
                  </h3>
                  <p className="text-caption text-muted-foreground truncate">
                    {formatOrderDate(order.createdAt)}
                  </p>
                </div>
              </div>

              <p className="text-body-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                {itemSummary}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  isLoading={isReordering && reorderingId === order._id}
                  loadingLabel="Adding to basket"
                  onClick={() => reorder(order)}
                >
                  <RotateCcw aria-hidden="true" />
                  Order again
                </Button>
                <span className="text-price text-foreground tabular">
                  {formatPrice(order.total)}
                </span>
              </div>
            </article>
          );
        })}
      </Rail>

      <ReplaceBasketDialog
        open={Boolean(conflict)}
        currentRestaurantName={conflict?.currentRestaurantName}
        nextRestaurantName={conflict?.order?.restaurant?.name}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </Section>
  );
}
