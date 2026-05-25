import React from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  AlertCircle,
} from "lucide-react";
import useGetAvailableOrders from "@/hooks/Courier/useGetAvailableOrders";
import { ActiveDeliveryCard } from "./dashboard/ActiveDeliveryCard";
import { StatsGrid } from "./dashboard/StatsGrid";
import { EarningsOverview } from "./dashboard/EarningsOverview";
import useAcceptCourierOrder from "@/hooks/Courier/useAcceptCourierOrder";

export default function CourierDashboard() {
  const { isAvailable } = useOutletContext();
  const { courierAvailableOrders, isLoadingOrders } = useGetAvailableOrders(1);
  const { acceptCourierOrder, isAccepting } = useAcceptCourierOrder();

  const activeOrder = courierAvailableOrders?.data?.orders?.[0];
  const hasActiveOrder = Boolean(activeOrder);
  const stats = [
    { label: "Today's Earnings", value: "$84.50", icon: TrendingUp },
    { label: "Deliveries", value: "12", icon: Package },
    { label: "Acceptance Rate", value: "94%", icon: CheckCircle },
    { label: "Avg Time", value: "24 min", icon: Clock },
  ];

  const chartData = [
    { day: "Mon", earnings: 45 },
    { day: "Tue", earnings: 60 },
    { day: "Wed", earnings: 55 },
    { day: "Thu", earnings: 80 },
    { day: "Fri", earnings: 110 },
    { day: "Sat", earnings: 135 },
    { day: "Sun", earnings: 84.5 },
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

      <StatsGrid stats={stats} />

      <EarningsOverview chartData={chartData} />
    </div>
  );
}
