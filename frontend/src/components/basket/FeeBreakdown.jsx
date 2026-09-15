/**
 * Price breakdown.
 *
 * The same component renders in the basket panel, at checkout, on the
 * confirmation screen and in order history, so the customer sees an identical
 * set of lines and an identical total at every step. Nothing is deferred to
 * the last screen: delivery and service fees are visible from the basket on.
 */

import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { formatFee, formatPrice } from "@chowgo/shared/format";
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
  const { t } = useTranslation("basket");

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
                aria-label={t("summary.hintLabel", { label, hint })}
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
 * @param {import("@chowgo/shared/adapters/types").PriceBreakdownView} props.pricing
 * @param {boolean} [props.showTotal]
 * @param {string} [props.totalLabel]
 */
export function FeeBreakdown({ pricing, showTotal = true, totalLabel, className }) {
  const { t } = useTranslation("basket");

  return (
    <dl className={cn("space-y-2", className)}>
      <Row label={t("summary.subtotal")} value={formatPrice(pricing.subtotal)} />

      <Row
        label={t("summary.deliveryFee")}
        value={formatFee(pricing.deliveryFee)}
        hint={t("summary.deliveryFeeHint")}
      />

      <Row
        label={t("summary.serviceFee")}
        value={formatFee(pricing.serviceFee)}
        hint={t("summary.serviceFeeHint")}
      />

      {pricing.priorityFee > 0 && (
        <Row
          label={t("summary.priorityFee")}
          value={formatPrice(pricing.priorityFee)}
          hint={t("summary.priorityFeeHint")}
        />
      )}

      {pricing.tax > 0 && <Row label={t("summary.tax")} value={formatPrice(pricing.tax)} />}

      {pricing.tip > 0 && <Row label={t("summary.tip")} value={formatPrice(pricing.tip)} />}

      {pricing.discount > 0 && (
        <Row
          label={t("summary.discount")}
          value={`-${formatPrice(pricing.discount)}`}
          tone="discount"
        />
      )}

      {showTotal && (
        <>
          <div className="border-border border-t pt-2" />
          <Row
            label={totalLabel ?? t("summary.total")}
            value={formatPrice(pricing.total)}
            tone="total"
          />
        </>
      )}
    </dl>
  );
}
