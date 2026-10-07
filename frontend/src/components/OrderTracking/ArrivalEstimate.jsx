import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { estimateArrival } from "@chowgo/shared/adapters/order";
import { formatTime } from "@chowgo/shared/format";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

export function ArrivalEstimate({ order, routeSeconds = null, className }) {
  const { t } = useTranslation(["order", "common"]);
  const now = useNow(30000, Boolean(order?.etaAt) || routeSeconds != null);
  const eta = estimateArrival(order, { routeSeconds, now });
  if (!eta) return null;

  const time = formatTime(eta.at);
  const headline = eta.isLate
    ? t("order:eta.late")
    : eta.minutes === 0
      ? t("order:eta.arriving")
      : t("order:eta.minutes", { count: eta.minutes });
  const detail = eta.isLate
    ? t("order:eta.lateHint", { time })
    : [t("order:eta.around", { time }), eta.isLive ? t("order:eta.liveHint") : null]
        .filter(Boolean)
        .join(" · ");

  return (
    <div className={cn("flex items-center gap-3", className)} role="status" aria-live="polite">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          eta.isLate ? "bg-warning-subtle text-warning" : "bg-primary-subtle text-primary",
        )}
        aria-hidden="true"
      >
        <Clock className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground">{t("order:eta.label")}</p>
        <p className={cn("text-h2 tabular", eta.isLate ? "text-warning" : "text-foreground")}>
          {headline}
        </p>
        <p className="text-body-sm text-muted-foreground truncate">{detail}</p>
      </div>
    </div>
  );
}
