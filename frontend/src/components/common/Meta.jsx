/**
 * Small display components shared across cards, headers and summaries.
 *
 * These are the pieces that make restaurants comparable at a glance: rating,
 * delivery estimate, fee, distance, availability. Keeping them here means a
 * rating renders identically on a discovery card, a search result and the
 * restaurant header.
 */

import { Bike, Clock, MapPin, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDistance,
  formatFee,
  formatPrice,
  formatRating,
  formatReviewCount,
} from "@/lib/format";

/**
 * One piece of metadata: an icon and a value. The icon is always decorative -
 * the text next to it carries the meaning, so this never relies on iconography
 * alone.
 *
 * @param {Object} props
 * @param {import("lucide-react").LucideIcon} props.icon
 * @param {React.ReactNode} props.children
 * @param {string} [props.label] Prefix read only by screen readers, e.g.
 *   "Delivery time" before "25-35 min".
 */
export function MetaItem({ icon: Icon, children, label, className }) {
  return (
    <span className={cn("text-body-sm text-muted-foreground inline-flex items-center gap-1.5", className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label && <span className="sr-only">{label}: </span>}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** The dot separator used between metadata items. */
export function MetaDot() {
  return <span className="bg-border-strong size-1 shrink-0 rounded-full" aria-hidden="true" />;
}

/**
 * A rating and its review count.
 *
 * Renders nothing but an honest "New" marker when a restaurant has no ratings,
 * rather than the placeholder 4.5 the old cards showed.
 *
 * @param {Object} props
 * @param {number | null} props.rating
 * @param {number} [props.reviewCount]
 * @param {"sm"|"md"} [props.size]
 * @param {boolean} [props.showCount]
 */
export function RatingDisplay({ rating, reviewCount = 0, size = "sm", showCount = true, className }) {
  const value = formatRating(rating);

  if (!value) {
    return (
      <span className={cn("text-body-sm text-muted-foreground", className)}>New</span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Rated ${value} out of 5${reviewCount ? ` from ${reviewCount} reviews` : ""}`}
    >
      <Star
        className={cn("fill-rating text-rating shrink-0", size === "md" ? "size-4" : "size-3.5")}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-foreground tabular font-semibold",
          size === "md" ? "text-body" : "text-body-sm",
        )}
        aria-hidden="true"
      >
        {value}
      </span>
      {showCount && reviewCount > 0 && (
        <span className="text-caption text-muted-foreground tabular" aria-hidden="true">
          ({formatReviewCount(reviewCount)})
        </span>
      )}
    </span>
  );
}

/**
 * Delivery estimate.
 *
 * @param {Object} props
 * @param {string} props.estimate
 */
export function DeliveryEstimate({ estimate, className }) {
  return (
    <MetaItem icon={Clock} label="Delivery time" className={className}>
      {estimate}
    </MetaItem>
  );
}

/**
 * Delivery fee. "Free" is a selling point, so it is styled as one.
 *
 * @param {Object} props
 * @param {number} props.fee
 */
export function DeliveryFee({ fee, className }) {
  const isFree = fee === 0;
  return (
    <span
      className={cn(
        "text-body-sm inline-flex items-center gap-1.5",
        isFree ? "text-success font-semibold" : "text-muted-foreground",
        className,
      )}
    >
      <Bike className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Delivery fee: </span>
      {formatFee(fee)}
    </span>
  );
}

/**
 * Distance from the customer, in metres from the API. Renders nothing when the
 * endpoint did not provide one, rather than guessing.
 *
 * @param {Object} props
 * @param {number | null} props.metres
 */
export function DistanceLabel({ metres, className }) {
  const value = formatDistance(metres);
  if (!value) return null;
  return (
    <MetaItem icon={MapPin} label="Distance" className={className}>
      {value}
    </MetaItem>
  );
}

/**
 * A price. Always tabular so columns of prices align.
 *
 * @param {Object} props
 * @param {number} props.value
 * @param {"sm"|"md"|"lg"} [props.size]
 * @param {boolean} [props.muted]
 */
export function Price({ value, size = "md", muted = false, className }) {
  return (
    <span
      className={cn(
        "tabular whitespace-nowrap",
        size === "lg" && "text-price-lg",
        size === "md" && "text-price",
        size === "sm" && "text-body-sm font-semibold",
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
}

/**
 * A price that may be discounted.
 *
 * The reduced price is green - the same green that means "good" everywhere
 * else in the product - and the original sits beside it struck through, so the
 * saving is legible without a badge. Screen readers get both, in order, with
 * the relationship spelled out rather than implied by the line-through.
 *
 * @param {Object} props
 * @param {number} props.price Current price.
 * @param {number | null} [props.basePrice] Undiscounted price, or null.
 * @param {"sm"|"md"|"lg"} [props.size]
 */
export function PromoPrice({ price, basePrice, size = "md", className }) {
  const isDiscounted = typeof basePrice === "number" && basePrice > price;

  if (!isDiscounted) {
    return <Price value={price} size={size} className={className} />;
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <Price value={price} size={size} className="text-primary" />
      <span className="text-muted-foreground text-body-sm tabular line-through">
        <span className="sr-only">, reduced from </span>
        {formatPrice(basePrice)}
      </span>
    </span>
  );
}
