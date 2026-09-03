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
import PaginationSelector from "@/components/ui/PaginationSelector";

const HISTORY_LIMIT = 10;

export function CourierOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");
  const [historyPage, setHistoryPage] = useState(1);

  const { courierAvailableOrders, isLoadingOrders } = useGetAvailableOrders();
  const { courierOrders: activeData } = useGetCourierOrders("active");
  const {
    courierOrders: courierHistory,
    isLoadingCourierOrders: isLoadingHistory,
    isFetchingCourierOrders: isFetchingHistory,
  } = useGetCourierOrders("history", historyPage, HISTORY_LIMIT);

  const historyOrders = courierHistory?.data?.orders ?? [];
  const historyPagination = courierHistory?.data?.pagination;
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
          className="flex items-center justify-between rounded-2xl border border-primary bg-primary-subtle px-5 py-4 transition hover:bg-primary-subtle "
        >
          <div>
            <p className="text-sm font-bold text-primary ">
              Active delivery in progress
            </p>
            <p className="text-sm text-primary/80 ">
              {activeOrder.restaurant?.name ?? "Restaurant"} → customer
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary ">
            <Navigation className="h-4 w-4" />
            Resume
          </span>
        </Link>
      )}

      <div className="flex space-x-1 rounded-xl bg-secondary/50 p-1 ">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "text-foreground "
                : "text-muted-foreground hover:text-muted-foreground "
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-lg bg-card shadow-sm "
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
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary ">
                <MapPin className="h-3.5 w-3.5" />
                Showing orders near your location
              </p>
            )}

            {isLoadingOrders && <Spinner />}

            {!isLoadingOrders && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center ">
                <Package className="h-10 w-10 text-muted-foreground " />
                <p className="font-medium text-muted-foreground ">
                  No available orders nearby
                </p>
                <p className="text-sm text-muted-foreground ">
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
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center ">
                <Package className="h-10 w-10 text-muted-foreground " />
                <p className="font-medium text-muted-foreground ">
                  No completed deliveries yet
                </p>
              </div>
            )}

            {!isLoadingHistory &&
              historyOrders.map((order) => (
                <CourierOrderHistoryCard key={order._id} order={order} />
              ))}

            {!isLoadingHistory && historyPagination && (
              <PaginationSelector
                pagination={historyPagination}
                page={historyPage}
                setPage={setHistoryPage}
                isFetching={isFetchingHistory}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
