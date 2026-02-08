import { StatCard } from "@/components/ui/StatCard";
import { Clock, DollarSign, Users, Utensils } from "lucide-react";

export const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value={`$${stats.totalRevenue.value}`}
        trend={`${stats.totalRevenue.trend}%`}
        isPositive={stats.totalRevenue.isPositive}
        icon={DollarSign}
        colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
      />
      <StatCard
        title="Active Orders"
        value={stats.activeOrders.value.toString()}
        trend={`${stats.activeOrders.trend}%`}
        isPositive={stats.activeOrders.isPositive}
        icon={Clock}
        colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      />
      <StatCard
        title="Total Customers"
        value={stats.totalCustomers.value.toLocaleString()}
        trend={`${stats.totalCustomers.trend}%`}
        isPositive={stats.totalCustomers.isPositive}
        icon={Users}
        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      />
      <StatCard
        title="Avg. Rating"
        value={stats.avgRating.value}
        trend={`${stats.avgRating.totalReviews} reviews`}
        isPositive={true}
        icon={Utensils}
        colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
      />
    </div>
  );
};
