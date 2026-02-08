import { useAuthStore } from "@/store/useAuthStore";
import useGetRestaurantStats from "@/hooks/Restaurants/useGetRestaurantStats";
import Spinner from "@/components/Spinner";
import { DashboardStats } from "./DashboardStats";
import { RevenueChart } from "./RevenueChart";
import { PopularItems } from "./PopularItems";
import { RecentOrders } from "./RecentOrders";

export const SellerDashboard = () => {
  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant[0]?._id;

  const { restaurantStats, isLoadingStats, error } =
    useGetRestaurantStats(restaurantId);

  if (isLoadingStats) {
    return <Spinner fullScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error.response?.data?.message || "Failed to load dashboard data"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!restaurantStats) {
    return null;
  }

  return (
    <div className="space-y-8">
      <DashboardStats stats={restaurantStats.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RevenueChart chartData={restaurantStats.chartData} />
        <PopularItems items={restaurantStats.popularItems} />
      </div>

      <RecentOrders orders={restaurantStats.recentOrders} />
    </div>
  );
};
