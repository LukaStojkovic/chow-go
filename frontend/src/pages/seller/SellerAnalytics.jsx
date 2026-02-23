import useGetRestaurantAnalytics from "@/hooks/Restaurants/useGetRestaurantAnalytics";
import { useAuthStore } from "@/store/useAuthStore";
import { AlertCircle } from "lucide-react";
import { KpiGrid } from "@/components/Seller/Analytics/KpiGrid";
import { PeakHoursChart } from "@/components/Seller/Analytics/Charts/PeakHoursChart";
import { OrderBreakdownChart } from "@/components/Seller/Analytics/Charts/OrderBreakdownChart";
import { PaymentMethodChart } from "@/components/Seller/Analytics/Charts/PaymentMethodChart";
import { RevenueLineChart } from "@/components/Seller/Analytics/Charts/RevenueLineChart";
import { TopItemsSection } from "@/components/Seller/Analytics/TopItemsSection";
import { RecentRatingsSection } from "@/components/Seller/Analytics/RecentRatingsSection";

export const SellerAnalytics = () => {
  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant[0]?._id;

  const { restaurantAnalytics, isLoadingAnalytics, error } =
    useGetRestaurantAnalytics(restaurantId);

  if (isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-400">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  const data = restaurantAnalytics.data;

  return (
    <div className="space-y-6">
      <KpiGrid kpis={data.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PeakHoursChart data={data.peakHours} />
        <RevenueLineChart data={data.dailyRevenue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderBreakdownChart data={data.orderStatusBreakdown} />
        <PaymentMethodChart data={data.paymentMethodSplit} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopItemsSection items={data.topItems} />
        <RecentRatingsSection ratings={data.recentRatings} />
      </div>
    </div>
  );
};
