import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";

import { kitchenLeadMinutes } from "@chowgo/shared/scheduling";
import { cn } from "@/lib/utils";
import { formatScheduledFor } from "@chowgo/shared/deliveryTime";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").OrderView} props.order
 * @param {string | Date | null} [props.releaseAt] When the order reaches the kitchen.
 */
export function ScheduledDelivery({ order, releaseAt = null, className }) {
  const { t } = useTranslation(["order", "common"]);
  if (!order?.isScheduled || !order.scheduledFor) return null;
  const lead = releaseAt
    ? Math.round((new Date(order.scheduledFor) - new Date(releaseAt)) / 60000)
    : kitchenLeadMinutes();

  return (
    <div className={cn("flex items-start gap-3", className)} role="status">
      <span
        className="bg-info-subtle text-info flex size-12 shrink-0 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <CalendarClock className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground">{t("order:scheduled.title")}</p>
        <p className="text-h2 tabular text-foreground">{formatScheduledFor(order.scheduledFor)}</p>
        <p className="text-body-sm text-muted-foreground">
          {t("order:scheduled.hint", { minutes: lead })}
        </p>
        {order.canCancel && (
          <p className="text-body-sm text-muted-foreground">{t("order:scheduled.cancelHint")}</p>
        )}
      </div>
    </div>
  );
}
