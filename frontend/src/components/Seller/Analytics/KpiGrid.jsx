import { DollarSign, ShoppingBag, TrendingUp, Star } from "lucide-react";
import { KpiCard } from "./KpiCard";

export const KpiGrid = ({ kpis }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={DollarSign}
        label="Today's Revenue"
        value={`$${kpis.todayRevenue.toFixed(2)}`}
        sub={`${kpis.todayOrders} orders`}
        color="bg-emerald-500"
      />

      <KpiCard
        icon={ShoppingBag}
        label="Monthly Revenue"
        value={`$${kpis.monthlyRevenue.toFixed(2)}`}
        sub="Last 30 days"
        color="bg-indigo-500"
      />

      <KpiCard
        icon={TrendingUp}
        label="Avg Order Value"
        value={`$${(kpis.avgOrderValue || 0).toFixed(2)}`}
        sub="Today"
        color="bg-amber-500"
      />

      <KpiCard
        icon={Star}
        label="Rating"
        value={kpis.averageRating?.toFixed(1) || "—"}
        sub={`${kpis.totalReviews} reviews`}
        color="bg-rose-500"
      />
    </div>
  );
};
