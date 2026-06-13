import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Navigation, Package } from "lucide-react";
import useGetAvailableOrders from "@/hooks/Courier/useGetAvailableOrders";
import useGetCourierOrders from "@/hooks/Courier/useGetCourierOrders";
import useAcceptCourierOrder from "@/hooks/Courier/useAcceptCourierOrder";
import Spinner from "@/components/Spinner";
import { CourierOrderCard } from "@/components/Courier/components/CourierOrderCard";
import CourierOrderHistoryCard from "@/components/Courier/components/CourierOrderHistoryCard";

export function CourierOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");
  const { courierAvailableOrders, isLoadingOrders } = useGetAvailableOrders();
  const { courierOrders: activeData } = useGetCourierOrders("active");
  const { courierOrders: courierHistory, isLoading: isLoadingHistory } =
    useGetCourierOrders("history");
  const historyOrders = courierHistory?.data?.orders ?? [];
  const activeOrder = activeData?.data?.orders?.[0];

  const orders = courierAvailableOrders?.data?.orders ?? [];
  const geoFiltered = courierAvailableOrders?.data?.geoFiltered;
  const totalAvailable =
    courierAvailableOrders?.data?.pagination?.totalItems ?? 0;

  const { acceptCourierOrder, isAccepting } = useAcceptCourierOrder();

  function handleAccept(orderId) {
    acceptCourierOrder(orderId, {
      onSuccess: () => navigate(`/courier/delivery/${orderId}`),
    });
  }

  const tabs = [
    { id: "available", label: `Available (${totalAvailable})` },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-6">
      {activeOrder && (
        <Link
          to={`/courier/delivery/${activeOrder._id}`}
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30"
        >
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              Active delivery in progress
            </p>
            <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
              {activeOrder.restaurant?.name ?? "Restaurant"} → customer
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <Navigation className="h-4 w-4" />
            Resume
          </span>
        </Link>
      )}

      <div className="flex space-x-1 rounded-xl bg-gray-200/50 p-1 dark:bg-zinc-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-zinc-800"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "available" && (
          <div className="space-y-4">
            {geoFiltered && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-3.5 w-3.5" />
                Showing orders near your location
              </p>
            )}

            {isLoadingOrders && <Spinner />}

            {!isLoadingOrders && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-zinc-800">
                <Package className="h-10 w-10 text-gray-300 dark:text-zinc-700" />
                <p className="font-medium text-gray-500 dark:text-gray-400">
                  No available orders nearby
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  New orders will appear here automatically
                </p>
              </div>
            )}

            {!isLoadingOrders &&
              orders.map((order) => (
                <CourierOrderCard
                  key={order._id}
                  order={order}
                  onAccept={handleAccept}
                  isAccepting={isAccepting}
                />
              ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {isLoadingHistory && <Spinner />}

            {!isLoadingHistory && historyOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-zinc-800">
                <Package className="h-10 w-10 text-gray-300 dark:text-zinc-700" />
                <p className="font-medium text-gray-500 dark:text-gray-400">
                  No completed deliveries yet
                </p>
              </div>
            )}

            {!isLoadingHistory &&
              historyOrders.map((order) => (
                <CourierOrderHistoryCard key={order._id} order={order} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
