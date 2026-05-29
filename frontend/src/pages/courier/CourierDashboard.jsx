import React from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  AlertCircle,
  Star,
} from "lucide-react";

import useGetAvailableOrders from "@/hooks/Courier/useGetAvailableOrders";
import { ActiveDeliveryCard } from "./dashboard/ActiveDeliveryCard";
import { StatsGrid } from "./dashboard/StatsGrid";
import { EarningsOverview } from "./dashboard/EarningsOverview";
import useAcceptCourierOrder from "@/hooks/Courier/useAcceptCourierOrder";
import { useCourierOverview } from "@/hooks/Courier/useCourierOverview";

export default function CourierDashboard() {
  const { isAvailable } = useOutletContext();
  const { courierAvailableOrders, isLoadingOrders } = useGetAvailableOrders(1);
  const { acceptCourierOrder, isAccepting } = useAcceptCourierOrder();
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useCourierOverview();

  const activeOrder = courierAvailableOrders?.data?.orders?.[0];
  const hasActiveOrder = Boolean(activeOrder);

  const stats = [
    {
      label: "Today's Earnings",
      value: isLoadingAnalytics
        ? "—"
        : `$${analytics?.today?.earnings?.toFixed(2) ?? "0.00"}`,
      icon: TrendingUp,
    },
    {
      label: "Deliveries Today",
      value: isLoadingAnalytics
        ? "—"
        : String(analytics?.today?.deliveries ?? 0),
      icon: Package,
    },
    {
      label: "Acceptance Rate",
      value: isLoadingAnalytics
        ? "—"
        : `${analytics?.allTime?.acceptanceRate ?? 100}%`,
      icon: CheckCircle,
    },
    {
      label: "Avg Time",
      value: isLoadingAnalytics
        ? "—"
        : `${analytics?.today?.avgDeliveryTime ?? 0} min`,
      icon: Clock,
    },
    {
      label: "Rating",
      value: isLoadingAnalytics
        ? "—"
        : `${analytics?.allTime?.averageRating ?? "N/A"}`,
      icon: Star,
    },
  ];

  const chartData = analytics?.chartData ?? [
    { day: "Sun", earnings: 0 },
    { day: "Mon", earnings: 0 },
    { day: "Tue", earnings: 0 },
    { day: "Wed", earnings: 0 },
    { day: "Thu", earnings: 0 },
    { day: "Fri", earnings: 0 },
    { day: "Sat", earnings: 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!isAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You are currently off duty. Go on duty to start receiving delivery
            requests.
          </p>
        </motion.div>
      )}

      {isAvailable && (isLoadingOrders || hasActiveOrder) && (
        <ActiveDeliveryCard
          activeOrder={activeOrder}
          isLoadingOrders={isLoadingOrders}
          onAccept={acceptCourierOrder}
          isAccepting={isAccepting}
        />
      )}

      <StatsGrid analytics={analytics} isLoading={isLoadingAnalytics} />
      <EarningsOverview
        chartData={analytics?.chartData ?? []}
        recentOrders={analytics?.recentOrders ?? []}
      />
    </div>
  );
}
