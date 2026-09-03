/**
 * Price breakdown.
 *
 * The same component renders in the basket panel, at checkout, on the
 * confirmation screen and in order history, so the customer sees an identical
 * set of lines and an identical total at every step. Nothing is deferred to
 * the last screen: delivery and service fees are visible from the basket on.
 */

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatFee, formatPrice } from "@/lib/format";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.value
 * @param {string} [props.hint] Explains a fee. Rendered as a tooltip on
 *   pointer devices and as a description everywhere else.
 * @param {"default"|"discount"|"total"} [props.tone]
 */
function Row({ label, value, hint, tone = "default" }) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        tone === "total" ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <dt className={cn("flex items-center gap-1.5", tone === "total" ? "text-h3" : "text-body-sm")}>
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label={`What is the ${label.toLowerCase()}? ${hint}`}
              >
                <Info className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-56" aria-hidden="true">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}
      </dt>
      <dd
        className={cn(
          "tabular whitespace-nowrap",
          tone === "total" && "text-price-lg text-foreground",
          tone === "discount" && "text-success font-semibold",
          tone === "default" && "text-body-sm text-foreground font-medium",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {import("@/lib/adapters/types").PriceBreakdownView} props.pricing
 * @param {boolean} [props.showTotal]
 * @param {string} [props.totalLabel]
 */
export function FeeBreakdown({ pricing, showTotal = true, totalLabel = "Total", className }) {
  return (
    <dl className={cn("space-y-2", className)}>
      <Row label="Subtotal" value={formatPrice(pricing.subtotal)} />

      <Row
        label="Delivery fee"
        value={formatFee(pricing.deliveryFee)}
        hint="A flat fee that goes towards getting your order to you."
      />

      <Row
        label="Service fee"
        value={formatFee(pricing.serviceFee)}
        hint="Covers running the platform, payment handling and support."
      />

      {pricing.priorityFee > 0 && (
        <Row
          label="Priority delivery"
          value={formatPrice(pricing.priorityFee)}
          hint="Moves your order to the front of the courier queue."
        />
      )}

      {pricing.tax > 0 && <Row label="Tax" value={formatPrice(pricing.tax)} />}

      {pricing.tip > 0 && <Row label="Courier tip" value={formatPrice(pricing.tip)} />}

      {pricing.discount > 0 && (
        <Row label="Discount" value={`-${formatPrice(pricing.discount)}`} tone="discount" />
      )}

      {showTotal && (
        <>
          <div className="border-border border-t pt-2" />
          <Row label={totalLabel} value={formatPrice(pricing.total)} tone="total" />
        </>
      )}
    </dl>
  );
}
