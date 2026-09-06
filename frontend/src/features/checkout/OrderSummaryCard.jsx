/**
 * The order summary, and the place the order is actually submitted.
 *
 * Sticky beside the form on desktop; stacked below it on mobile, where the
 * "Place order" action is duplicated into a sticky bar so the total and the
 * button are never both off-screen at once.
 *
 * Blocking reasons are listed in plain text next to the disabled button. A
 * disabled primary action with no explanation is the single most common way
 * a checkout dead-ends.
 */

import { Link } from "react-router-dom";
import { ShieldCheck, UtensilsCrossed } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/common/SmartImage";
import { BasketLine } from "@/components/basket/BasketLine";
import { FeeBreakdown } from "@/components/basket/FeeBreakdown";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").BasketLineView[]} props.lines
 * @param {Object | null} props.restaurant Raw cart restaurant document.
 * @param {import("@chowgo/shared/adapters/types").PriceBreakdownView} props.pricing
 * @param {string[]} props.blockers Human-readable reasons the order cannot be
 *   placed. Empty means ready.
 * @param {boolean} props.isPlacing
 * @param {() => void} props.onPlaceOrder
 */
export function OrderSummaryCard({
  lines,
  restaurant,
  pricing,
  blockers,
  isPlacing,
  onPlaceOrder,
}) {
  const canPlace = blockers.length === 0;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="border-border flex items-center gap-3 border-b p-4">
        <Avatar
          src={restaurant?.profilePicture}
          name={restaurant?.name || "Restaurant"}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 truncate">{restaurant?.name || "Your order"}</h2>
          {restaurant?._id && (
            <Link
              to={`/restaurant/${restaurant._id}`}
              className="text-body-sm text-primary hover:underline"
            >
              Edit your order
            </Link>
          )}
        </div>
        <UtensilsCrossed className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </div>

      <div className="max-h-72 overflow-y-auto px-4">
        <ul className="divide-border divide-y">
          {lines.map((line) => (
            <BasketLine key={line.id} line={line} mode="summary" />
          ))}
        </ul>
      </div>

      <div className="border-border border-t p-4">
        <FeeBreakdown pricing={pricing} />
      </div>

      <div className="border-border space-y-3 border-t p-4">
        {!canPlace && (
          <ul
            // Announced when a blocker appears or clears, so a screen-reader
            // user is not left pressing a dead button.
            aria-live="polite"
            className="text-body-sm text-muted-foreground space-y-1"
          >
            {blockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}

        <Button
          size="lg"
          block
          // Only ever rendered on desktop; the mobile action lives in the
          // sticky bar so it cannot scroll away from the total.
          className="hidden lg:flex"
          disabled={!canPlace}
          isLoading={isPlacing}
          loadingLabel="Placing your order"
          onClick={onPlaceOrder}
        >
          <span>Place order</span>
          <span className="tabular ml-auto">{formatPrice(pricing.total)}</span>
        </Button>

        <p className="text-caption text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          Your details are sent over an encrypted connection.
        </p>
      </div>
    </Card>
  );
}
