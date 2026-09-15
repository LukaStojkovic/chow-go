import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import useGetRestaurantStats from "@/hooks/Restaurants/useGetRestaurantStats";
import { SellerDashboardSkeleton } from "@/components/skeletons/SellerSkeletons";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { DashboardStats } from "./DashboardStats";
import { RevenueChart } from "./RevenueChart";
import { PopularItems } from "./PopularItems";
import { RecentOrders } from "./RecentOrders";

export const SellerDashboard = () => {
  const { t } = useTranslation(["seller", "common"]);
  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant[0]?._id;

  const { restaurantStats, isLoadingStats, error } =
    useGetRestaurantStats(restaurantId);

  if (isLoadingStats) {
    return <SellerDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error.response?.data?.message || t("settings.dashboardLoadFailed")}
          </p>
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors"
              >
                {t("common:actions.retry")}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("dashboard.reload")}</TooltipContent>
          </Tooltip>
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
