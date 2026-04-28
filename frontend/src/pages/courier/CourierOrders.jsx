import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Package } from "lucide-react";
import useGetAvailableOrders from "@/hooks/Courier/useGetAvailableOrders";
import useGetCourierOrders from "@/hooks/Courier/useGetCourierOrders";
import useAcceptCourierOrder from "@/hooks/Courier/useAcceptCourierOrder";
import { ActiveOrderCard } from "@/components/Courier/components/ActiveOrderCard";
import Spinner from "@/components/Spinner";
import { CourierOrderCard } from "@/components/Courier/components/CourierOrderCard";

export function CourierOrders() {
  const [activeTab, setActiveTab] = useState("available");
  const { courierAvailableOrders, isLoadingOrders } = useGetAvailableOrders();
  const { courierOrders, isLoadingCourierOrders } =
    useGetCourierOrders("active");

  const orders = courierAvailableOrders?.data?.orders ?? [];
  const geoFiltered = courierAvailableOrders?.data?.geoFiltered;
  const totalAvailable =
    courierAvailableOrders?.data?.pagination?.totalItems ?? 0;

  const activeOrders = courierOrders?.data?.orders ?? [];
  const { acceptCourierOrder, isAccepting } = useAcceptCourierOrder();

  const tabs = [
    { id: "available", label: `Available (${totalAvailable})` },
    { id: "active", label: "Active" },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-6">
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
                  onAccept={acceptCourierOrder}
                  isAccepting={isAccepting}
                />
              ))}
          </div>
        )}

        {activeTab === "active" && (
          <div className="space-y-4">
            {isLoadingCourierOrders && <Spinner />}

            {!isLoadingCourierOrders && activeOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-zinc-800">
                <Package className="h-10 w-10 text-gray-300 dark:text-zinc-700" />
                <p className="font-medium text-gray-500 dark:text-gray-400">
                  No active deliveries
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Accept an order to get started
                </p>
              </div>
            )}

            {!isLoadingCourierOrders &&
              activeOrders.map((order) => (
                <ActiveOrderCard key={order._id} order={order} />
              ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing deliveries for today
            </p>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Order #102{item}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Completed at 2:{item}0 PM
                  </p>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +$6.50
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
