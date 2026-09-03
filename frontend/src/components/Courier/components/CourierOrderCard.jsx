import { useState } from "react";
import { Clock, MapPin } from "lucide-react";
import Spinner from "@/components/Spinner";
import { CourierOrderDetailSheet } from "./CourierOrderDetailSheet";

export function CourierOrderCard({ order, onAccept, isAccepting }) {
  const [showDetails, setShowDetails] = useState(false);

  const distanceKm = order.deliveryDistance
    ? (order.deliveryDistance / 1000).toFixed(1)
    : null;

  const restaurantAddress = order.restaurant?.address
    ? `${order.restaurant.address.street}, ${order.restaurant.address.city}`
    : "Address unavailable";

  const deliveryAddress =
    order.deliveryAddressSnapshot?.fullAddress ?? "Address unavailable";

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 ">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4 ">
          <div>
            <span className="text-lg font-bold text-foreground ">
              ${order.total?.toFixed(2)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground ">
              #{order.orderNumber?.split("-")[2]}
            </span>
          </div>
          {distanceKm && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground ">
              <Clock className="h-4 w-4" />
              {distanceKm} km away
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-card " />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground ">
                {order.restaurant?.name ?? "Restaurant"}
              </p>
              <p className="truncate text-sm text-muted-foreground ">
                {restaurantAddress}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="font-medium text-foreground ">
                Customer dropoff
              </p>
              <p className="truncate text-sm text-muted-foreground ">
                {deliveryAddress}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground ">
            {order.items?.length === 1
              ? `${order.items[0].quantity}x ${order.items[0].name}`
              : `${order.items?.reduce((s, i) => s + i.quantity, 0)} items`}
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShowDetails(true)}
            className="flex-1 rounded-xl border border-border bg-muted py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted "
          >
            Details
          </button>
          <button
            onClick={() => onAccept(order._id)}
            disabled={isAccepting}
            className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg  transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAccepting ? <Spinner /> : "Accept Delivery"}
          </button>
        </div>
      </div>

      {showDetails && (
        <CourierOrderDetailSheet
          order={order}
          onClose={() => setShowDetails(false)}
          onAccept={onAccept}
          isAccepting={isAccepting}
        />
      )}
    </>
  );
}
