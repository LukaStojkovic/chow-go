import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  AlertCircle,
  Star,
  Navigation,
} from "lucide-react";
import { Link } from "react-router-dom";

import useGetAvailableOrders from "@/hooks/Courier/useGetAvailableOrders";
import useGetCourierOrders from "@/hooks/Courier/useGetCourierOrders";
import { ActiveDeliveryCard } from "./dashboard/ActiveDeliveryCard";
import { StatsGrid } from "./dashboard/StatsGrid";
import { EarningsOverview } from "./dashboard/EarningsOverview";
import useAcceptCourierOrder from "@/hooks/Courier/useAcceptCourierOrder";
import { useCourierOverview } from "@/hooks/Courier/useCourierOverview";

export default function CourierDashboard() {
  const navigate = useNavigate();
  const { isAvailable } = useOutletContext();
  const { courierAvailableOrders, isLoadingOrders } = useGetAvailableOrders(1);
  const { courierOrders: activeData } = useGetCourierOrders("active");
  const { acceptCourierOrder, isAccepting } = useAcceptCourierOrder();
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useCourierOverview();

  const availableOrder = courierAvailableOrders?.data?.orders?.[0];
  const inProgressOrder = activeData?.data?.orders?.[0];
  const hasAvailableOrder = Boolean(availableOrder);

  function handleAccept(orderId) {
    acceptCourierOrder(orderId, {
      onSuccess: () => navigate(`/courier/delivery/${orderId}`),
    });
  }

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

      {inProgressOrder && (
        <Link
          to={`/courier/delivery/${inProgressOrder._id}`}
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Delivery in progress
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {inProgressOrder.restaurant?.name ?? "Restaurant"}
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Navigation className="h-4 w-4" />
            Open map
          </span>
        </Link>
      )}

      {isAvailable && !inProgressOrder && (isLoadingOrders || hasAvailableOrder) && (
        <ActiveDeliveryCard
          activeOrder={availableOrder}
          isLoadingOrders={isLoadingOrders}
          onAccept={handleAccept}
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
