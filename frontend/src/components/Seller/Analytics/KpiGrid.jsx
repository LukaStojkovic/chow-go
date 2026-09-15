import { DollarSign, ShoppingBag, TrendingUp, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { KpiCard } from "./KpiCard";

export const KpiGrid = ({ kpis }) => {
  const { t } = useTranslation("seller");
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={DollarSign}
        label={t("analytics.todayRevenue")}
        value={`$${kpis.todayRevenue.toFixed(2)}`}
        sub={`${kpis.todayOrders} orders`}
        color="bg-primary"
        tooltip={t("analytics.revenueToday")}
      />

      <KpiCard
        icon={ShoppingBag}
        label={t("analytics.monthlyRevenue")}
        value={`$${kpis.monthlyRevenue.toFixed(2)}`}
        sub={t("analytics.range.month")}
        color="bg-primary"
        tooltip={t("analytics.revenue30Days")}
      />

      <KpiCard
        icon={TrendingUp}
        label={t("analytics.averageOrderValue")}
        value={`$${(kpis.avgOrderValue || 0).toFixed(2)}`}
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
