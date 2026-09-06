/**
 * One dish inside a restaurant menu.
 *
 * A row, not a photo card. A 60-item menu laid out as a grid of hero images is
 * beautiful and unusable - the row keeps the name, description and price on a
 * single scannable left edge with the photo as support.
 *
 * The whole row is the button. There is no separate "+" control competing with
 * it, so there is exactly one thing to press and one thing in the
 * accessibility tree.
 */

import { motion } from "framer-motion";
import { Plus, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { listItem } from "@/lib/motion";
import { formatPrice } from "@chowgo/shared/format";
import { SmartImage } from "@/components/common/SmartImage";
import { PromoPrice } from "@/components/common/Meta";
import { PromoBadge, SoldOutBadge } from "@/components/common/StatusBadges";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").DishView} props.dish
 * @param {(dish: import("@chowgo/shared/adapters/types").DishView) => void} props.onSelect
 * @param {boolean} [props.isOrderingDisabled] The restaurant is closed.
 * @param {number} [props.inBasketCount] Shown so a repeat add is obvious.
 */
export function MenuItemRow({ dish, onSelect, isOrderingDisabled = false, inBasketCount = 0 }) {
  const isDisabled = !dish.isAvailable || isOrderingDisabled;

  return (
    <motion.li variants={listItem}>
      <button
        type="button"
        onClick={() => onSelect(dish)}
        disabled={isDisabled}
        aria-label={`${dish.name}, ${formatPrice(dish.price)}${
          dish.discountPercent > 0 ? `, ${dish.discountPercent}% off` : ""
        }. ${
          !dish.isAvailable ? "Sold out." : isOrderingDisabled ? "Restaurant closed." : "Add to basket"
        }`}
        className={cn(
          "group border-border bg-card flex w-full items-start gap-3 rounded-md border p-3 text-left",
          "surface-interactive",
          "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          isDisabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-border-strong hover:shadow-raised active:translate-y-px",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start gap-2">
            <h4 className="text-h3 text-foreground min-w-0 flex-1">{dish.name}</h4>
            {inBasketCount > 0 && (
              <span
                className="bg-primary text-primary-foreground tabular flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold"
                aria-label={`${inBasketCount} in basket`}
              >
                {inBasketCount}
              </span>
            )}
          </div>

          {dish.description && (
            <p className="text-body-sm text-muted-foreground line-clamp-2">
              {dish.description}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <PromoPrice price={dish.price} basePrice={dish.basePrice} />
            {dish.isAvailable ? (
              <PromoBadge percent={dish.discountPercent} label={dish.promoLabel} size="sm" />
            ) : (
              <SoldOutBadge size="sm" />
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <SmartImage
            src={dish.image}
            alt=""
            ratio="square"
            fallbackIcon={UtensilsCrossed}
            className="size-24 rounded-sm sm:size-28"
            imgClassName={cn(
              !isDisabled && "image-zoom",
              !dish.isAvailable && "saturate-50",
            )}
          />

          {!isDisabled && (
            <span
              aria-hidden="true"
              className={cn(
                "bg-card text-primary border-border absolute right-1.5 bottom-1.5 flex size-8 items-center justify-center rounded-full border shadow-subtle",
                "transition-colors duration-(--duration-micro)",
                "group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary",
              )}
            >
              <Plus className="size-4" />
            </span>
          )}
        </div>
      </button>
    </motion.li>
  );
}

export function MenuItemRowSkeleton() {
  return (
    <li className="border-border bg-card flex items-start gap-3 rounded-md border p-3" aria-hidden="true">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="size-24 shrink-0 rounded-sm sm:size-28" />
    </li>
  );
}
