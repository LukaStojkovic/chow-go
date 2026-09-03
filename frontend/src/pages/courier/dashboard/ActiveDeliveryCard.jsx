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
    <div className="overflow-hidden rounded-3xl border border-primary bg-card shadow-xl  ">
      <div className="bg-primary-subtle px-6 py-4 ">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-primary ">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            ACTIVE DELIVERY
          </span>
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-bold text-primary ">
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
              <div className="absolute bottom-2 left-[11px] top-2 w-2px bg-secondary " />

              <div className="relative mb-6">
                <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-primary bg-card " />
                <h4 className="font-semibold text-foreground ">
                  {activeOrder?.restaurant?.name ?? "Restaurant"}
                </h4>
                <p className="text-sm text-muted-foreground ">
                  {activeOrder?.restaurant?.address
                    ? `${activeOrder.restaurant.address.street} • ${activeOrder.restaurant.address.city}`
                    : "Address unavailable"}
                </p>
              </div>

              <div className="relative">
                <MapPin className="absolute -left-7 top-0.5 h-5 w-5 text-destructive" />
                <h4 className="font-semibold text-foreground ">
                  Delivery Address
                </h4>
                <p className="text-sm text-muted-foreground ">
                  {activeOrder?.deliveryAddressSnapshot?.fullAddress ??
                    "Address unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/courier/orders"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted py-3 font-semibold text-foreground transition hover:bg-secondary "
              >
                View all deliveries
              </Link>
              <button
                onClick={() => handleAcceptOrder(activeOrder._id)}
                disabled={isAccepting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:bg-primary shadow-lg "
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
