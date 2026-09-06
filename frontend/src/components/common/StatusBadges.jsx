/**
 * Status badges.
 *
 * Each of these pairs a colour with a word. Colour alone never carries the
 * meaning - "Closed" is legible in greyscale, and a screen reader gets the
 * same sentence a sighted user reads.
 */

import { CircleCheck, CircleX, Clock, Tag, Truck, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS } from "@chowgo/shared/adapters/order";

/** Order status -> badge variant. Tones come from the adapter, not from here. */
const TONE_TO_VARIANT = {
  primary: "primary",
  info: "info",
  success: "success",
  warning: "warning",
  destructive: "destructive",
};

const STATUS_ICON = {
  pending: Clock,
  confirmed: CircleCheck,
  preparing: UtensilsCrossed,
  ready: UtensilsCrossed,
  assigned: Truck,
  picked_up: Truck,
  in_transit: Truck,
  delivered: CircleCheck,
  cancelled: CircleX,
  rejected: CircleX,
};

/**
 * @param {Object} props
 * @param {string} props.status Raw order status from the API.
 * @param {"sm"|"md"|"lg"} [props.size]
 * @param {boolean} [props.withIcon]
 */
export function OrderStatusBadge({ status, size = "md", withIcon = true, className }) {
  const meta = ORDER_STATUS[status] || ORDER_STATUS.pending;
  const Icon = STATUS_ICON[status] || Clock;

  return (
    <Badge variant={TONE_TO_VARIANT[meta.tone] || "default"} size={size} className={className}>
      {withIcon && <Icon aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}

/**
 * Whether a restaurant can be ordered from right now.
 *
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").RestaurantAvailability} props.availability
 * @param {"onCard"|"inline"} [props.placement] `onCard` sits over a photo.
 */
export function AvailabilityBadge({ availability, placement = "inline", size = "md", className }) {
  if (availability === "open") {
    if (placement === "onCard") return null; // Open is the default; no badge needed.
    return (
      <Badge variant="success" size={size} className={className}>
        Open now
      </Badge>
    );
  }

  const label = availability === "unavailable" ? "Not taking orders" : "Closed";

  return (
    <Badge
      variant={placement === "onCard" ? "overlay" : "muted"}
      size={size}
      className={cn(placement === "onCard" && "text-foreground", className)}
    >
      {label}
    </Badge>
  );
}

/** Marks a dish the kitchen has switched off. */
export function SoldOutBadge({ size = "md", className }) {
  return (
    <Badge variant="muted" size={size} className={className}>
      Sold out
    </Badge>
  );
}

/**
 * A live discount on a dish.
 *
 * The percentage is the headline because it is what people compare; the
 * seller's own label ("Weekend deal") rides alongside it when they wrote one.
 * Never rendered from colour alone - the number is the message.
 *
 * @param {Object} props
 * @param {number} props.percent Whole percent off. Renders nothing at 0.
 * @param {string | null} [props.label] Optional seller copy.
 * @param {"sm"|"md"|"lg"} [props.size]
 */
export function PromoBadge({ percent, label, size = "md", className }) {
  if (!percent) return null;

  return (
    <Badge variant="promo" size={size} className={className}>
      <Tag aria-hidden="true" />
      <span className="sr-only">Promotion: </span>
      {label ? `${label} · -${percent}%` : `-${percent}%`}
    </Badge>
  );
}
