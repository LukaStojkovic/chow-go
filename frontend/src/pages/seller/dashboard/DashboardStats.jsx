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
        colorClass="bg-primary-subtle text-primary "
      />
      <StatCard
        title="Active Orders"
        value={stats.activeOrders.value.toString()}
        trend={`${stats.activeOrders.trend}%`}
        isPositive={stats.activeOrders.isPositive}
        icon={Clock}
        colorClass="bg-warning-subtle text-warning "
      />
      <StatCard
        title="Total Customers"
        value={stats.totalCustomers.value.toLocaleString()}
        trend={`${stats.totalCustomers.trend}%`}
        isPositive={stats.totalCustomers.isPositive}
        icon={Users}
        colorClass="bg-primary-subtle text-primary "
      />
      <StatCard
        title="Avg. Rating"
        value={stats.avgRating.value}
        trend={`${stats.avgRating.totalReviews} reviews`}
        isPositive={true}
        icon={Utensils}
        colorClass="bg-info-subtle text-info "
      />
    </div>
  );
};
