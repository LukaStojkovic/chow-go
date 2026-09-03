/**
 * A single live deal, shown on the discovery promotions rail.
 *
 * Deliberately not a `DishCard`. A deal is sold on the number, not on the
 * dish: the discount is the headline, the dish name is the reason, and the
 * price does the closing. Laying it over the photo keeps the strip short
 * enough that the real browsing content below it stays above the fold.
 *
 * Every value on this card comes from a promotion a restaurant owner actually
 * set on that menu item - nothing here is a house marketing slot.
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { hoverLift, listItem } from "@/lib/motion";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "@/components/common/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").DishView} props.deal A dish with a
 *   live promotion. `discountPercent` is guaranteed non-zero by the endpoint.
 */
export function PromoCard({ deal }) {
  const href = deal.restaurantId ? `/restaurant/${deal.restaurantId}` : null;

  return (
    <motion.article
      variants={listItem}
      {...hoverLift}
      className={cn(
        "group bg-card relative h-40 w-72 shrink-0 snap-start overflow-hidden rounded-md sm:w-80",
        "shadow-subtle surface-interactive hover:shadow-raised focus-within:shadow-raised",
      )}
    >
      <SmartImage
        src={deal.image}
        alt=""
        ratio="none"
        fallbackIcon={UtensilsCrossed}
        className="absolute inset-0 size-full"
        imgClassName="image-zoom"
      />

      {/* Readability, not decoration: the copy sits on the left third, which
          the scrim darkens hardest. */}
      <div className="photo-scrim absolute inset-0" aria-hidden="true" />

      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          {deal.promoLabel ? (
            <Badge variant="promo" size="sm">
              {deal.promoLabel}
            </Badge>
          ) : (
            <span />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-scrim-foreground text-display tabular leading-none">
            <span className="sr-only">Save </span>
            {deal.discountPercent}%
            <span className="text-h3 ml-1.5 align-middle font-semibold">off</span>
          </p>

          <h3 className="text-scrim-foreground text-h3 mt-1.5 truncate">
            {href ? (
              <Link
                to={href}
                className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
              >
                {deal.name}
              </Link>
            ) : (
              deal.name
            )}
          </h3>

          <p className="text-scrim-foreground-muted text-body-sm mt-0.5 flex items-center gap-1.5 truncate">
            {deal.restaurantName && <span className="truncate">{deal.restaurantName}</span>}
            {deal.restaurantName && <span aria-hidden="true">·</span>}
            <span className="text-scrim-foreground tabular font-semibold">
              {formatPrice(deal.price)}
            </span>
            {deal.basePrice != null && (
              <span className="tabular line-through">
                <span className="sr-only">, reduced from </span>
                {formatPrice(deal.basePrice)}
              </span>
            )}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export function PromoCardSkeleton() {
  return (
    <div
      className="bg-card border-border h-40 w-72 shrink-0 overflow-hidden rounded-md border sm:w-80"
      aria-hidden="true"
    >
      <Skeleton className="size-full rounded-none" />
    </div>
  );
}
