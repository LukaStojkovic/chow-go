import { Ban, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@chowgo/shared/format";
import { currentLocale, intlLocale } from "@chowgo/shared/i18n";

import { percentChange } from "@/lib/reportFormat";
import { KpiCard } from "./KpiCard";

function Change({ current, previous, lowerIsBetter = false }) {
  const { t } = useTranslation("seller");
  const pct = percentChange(current, previous);
  if (pct === null) return <span>{t("reports.summary.newVsPrevious")}</span>;
  if (Math.round(pct) === 0) return <span>{t("reports.summary.unchanged")}</span>;
  const formatted = new Intl.NumberFormat(intlLocale(currentLocale()), {
    style: "percent",
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(pct / 100);
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  return (
    <span className={good ? "text-success" : "text-destructive"}>
      {t("reports.summary.vsPrevious", { change: formatted })}
    </span>
  );
}

export const KpiGrid = ({ summary, currency }) => {
  const { t } = useTranslation("seller");
  const previous = summary.previous ?? {};
  const refused = (summary.cancelled ?? 0) + (summary.rejected ?? 0);
  const refusedBefore = (previous.cancelled ?? 0) + (previous.rejected ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        icon={DollarSign}
        label={t("reports.summary.revenue")}
        value={formatPrice(summary.revenue, { currency })}
        sub={t("reports.summary.discounts", { amount: formatPrice(summary.discounts ?? 0, { currency }) })}
        change={<Change current={summary.revenue} previous={previous.revenue} />}
        color="bg-primary"
      />
      <KpiCard
        icon={ShoppingBag}
        label={t("reports.summary.orders")}
        value={summary.orders}
        sub={t("reports.summary.placed", { count: summary.placed ?? 0 })}
        change={<Change current={summary.orders} previous={previous.orders} />}
        color="bg-primary"
      />
      <KpiCard
        icon={TrendingUp}
        label={t("reports.summary.avgOrderValue")}
        value={formatPrice(summary.avgOrderValue ?? 0, { currency })}
        sub={t("reports.summary.perOrder")}
        change={<Change current={summary.avgOrderValue} previous={previous.avgOrderValue} />}
        color="bg-warning"
      />
      <KpiCard
        icon={Ban}
        label={t("reports.summary.refused")}
        value={refused}
        sub={t("reports.summary.refusedDetail", { cancelled: summary.cancelled ?? 0, rejected: summary.rejected ?? 0 })}
        change={<Change current={refused} previous={refusedBefore} lowerIsBetter />}
        color="bg-destructive"
      />
    </div>
  );
};
