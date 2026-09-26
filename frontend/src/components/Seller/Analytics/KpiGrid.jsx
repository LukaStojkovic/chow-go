import { DollarSign, ShoppingBag, TrendingUp, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { KpiCard } from "./KpiCard";

import { formatPrice } from "@chowgo/shared/format";
import { useCurrency } from "@/hooks/useCurrency";
export const KpiGrid = ({ kpis }) => {
  const currency = useCurrency();
  const { t } = useTranslation("seller");
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={DollarSign}
        label={t("analytics.todayRevenue")}
        value={formatPrice(kpis.todayRevenue, { currency })}
        sub={`${kpis.todayOrders} orders`}
        color="bg-primary"
        tooltip={t("analytics.revenueToday")}
      />

      <KpiCard
        icon={ShoppingBag}
        label={t("analytics.monthlyRevenue")}
        value={formatPrice(kpis.monthlyRevenue, { currency })}
        sub={t("analytics.range.month")}
        color="bg-primary"
        tooltip={t("analytics.revenue30Days")}
      />

      <KpiCard
        icon={TrendingUp}
        label={t("analytics.averageOrderValue")}
        value={formatPrice(kpis.avgOrderValue || 0, { currency })}
        sub={t("dashboard.stats.today")}
        color="bg-warning"
        tooltip={t("analytics.averageOrderToday")}
      />

      <KpiCard
        icon={Star}
        label={t("dashboard.stats.rating")}
        value={kpis.averageRating?.toFixed(1) || "—"}
        sub={`${kpis.totalReviews} reviews`}
        color="bg-destructive"
        tooltip={t("analytics.averageRatingHint")}
      />
    </div>
  );
};
