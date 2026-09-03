import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Navigation } from "lucide-react";
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
  const { isAvailable, activeOrder } = useOutletContext();
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!isAvailable && !activeOrder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-warning-subtle p-4 text-warning "
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
          className="flex items-center justify-between rounded-2xl border border-primary bg-primary-subtle px-6 py-5 transition hover:bg-primary-subtle "
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary ">
              Delivery in progress
            </p>
            <p className="mt-1 font-semibold text-foreground ">
              {inProgressOrder.restaurant?.name ?? "Restaurant"}
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
            <Navigation className="h-4 w-4" />
            Open map
          </span>
        </Link>
      )}

      {isAvailable &&
        !inProgressOrder &&
        (isLoadingOrders || hasAvailableOrder) && (
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
