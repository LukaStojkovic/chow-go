import React from "react";
import { MapPin, Navigation } from "lucide-react";
import Spinner from "@/components/Spinner";
import { Link, useNavigate } from "react-router-dom";

export function ActiveDeliveryCard({
  activeOrder,
  isLoadingOrders,
  onAccept,
  isAccepting,
}) {
  const payout =
    activeOrder?.total != null ? `$${activeOrder.total.toFixed(2)}` : "—";
  const navigate = useNavigate();

  async function handleAcceptOrder(orderId) {
    onAccept(orderId, {
      onSuccess: () => navigate(`/courier/delivery/${orderId}`),
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5 dark:border-gray-800 dark:bg-gray-900">
      <div className="bg-emerald-50 px-6 py-4 dark:bg-emerald-900/20">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            ACTIVE DELIVERY
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Est. Payout: {payout}
          </span>
        </div>
      </div>

      <div className="p-6">
        {isLoadingOrders ? (
          <div className="flex h-72 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="relative pl-6">
              <div className="absolute bottom-2 left-[11px] top-2 w-2px bg-gray-200 dark:bg-gray-700" />

              <div className="relative mb-6">
                <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-900" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {activeOrder?.restaurant?.name ?? "Restaurant"}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeOrder?.restaurant?.address
                    ? `${activeOrder.restaurant.address.street} • ${activeOrder.restaurant.address.city}`
                    : "Address unavailable"}
                </p>
              </div>

              <div className="relative">
                <MapPin className="absolute -left-7 top-0.5 h-5 w-5 text-red-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Delivery Address
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeOrder?.deliveryAddressSnapshot?.fullAddress ??
                    "Address unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/courier/orders"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-900 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                View all deliveries
              </Link>
              <button
                onClick={() => handleAcceptOrder(activeOrder._id)}
                disabled={isAccepting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              >
                <Navigation className="h-5 w-5" />
                {isAccepting ? <Spinner size={14} /> : "Accept Delivery"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
