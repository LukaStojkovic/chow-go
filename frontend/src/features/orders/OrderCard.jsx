/**
 * One order in the history list.
 *
 * Everything needed to recognise an order without opening it: restaurant,
 * date, status, what was in it, and the total. "Order again" is right here,
 * because repeat ordering is the main reason anyone opens this list.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, RotateCcw } from "lucide-react";

import { listItem } from "@/lib/motion";
import { formatOrderDate, formatPrice } from "@chowgo/shared/format";
import { Avatar } from "@/components/common/SmartImage";
import { OrderStatusBadge } from "@/components/common/StatusBadges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").OrderView} props.order
 * @param {() => void} [props.onReorder]
 * @param {boolean} [props.isReordering]
 */
export function OrderCard({ order, onReorder, isReordering = false }) {
  const summary = order.items
    .map((line) => `${line.quantity}x ${line.name}`)
    .join(", ");

  return (
    <motion.li variants={listItem}>
      <Card variant="interactive" className="relative overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <Avatar
            src={order.restaurant?.logo}
            name={order.restaurant?.name || "Restaurant"}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-h3 min-w-0 flex-1">
                <Link
                  to={`/orders/${order.id}`}
                  className="truncate outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
                >
                  {order.restaurant?.name || "Restaurant"}
                </Link>
              </h3>
              <ChevronRight
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            </div>

            <p className="text-body-sm text-muted-foreground">
              <span className="tabular">#{order.number}</span>
              {" - "}
              {formatOrderDate(order.placedAt)}
            </p>

            <div className="mt-2">
              <OrderStatusBadge status={order.status} />
            </div>

            <p className="text-body-sm text-muted-foreground mt-2 line-clamp-2">
              {summary}
            </p>
          </div>
        </div>

        <div className="border-border flex items-center justify-between gap-3 border-t px-4 py-2.5">
          <span className="text-price text-foreground tabular">
            {formatPrice(order.pricing.total)}
          </span>

          {order.canReorder && onReorder && (
            <Button
              variant="outline"
              size="sm"
              // Above the stretched card link.
              className="relative z-10"
              isLoading={isReordering}
              loadingLabel="Adding to basket"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onReorder();
              }}
            >
              <RotateCcw aria-hidden="true" />
              Order again
            </Button>
          )}
        </div>
      </Card>
    </motion.li>
  );
}

export function OrderCardSkeleton() {
  return (
    <li className="border-border bg-card rounded-md border" aria-hidden="true">
      <div className="flex items-start gap-3 p-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-28 rounded-xs" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="border-border flex items-center justify-between border-t px-4 py-2.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-32 rounded-sm" />
      </div>
    </li>
  );
}
