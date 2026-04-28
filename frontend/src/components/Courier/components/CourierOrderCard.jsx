import Spinner from "@/components/Spinner";
import { Clock, MapPin } from "lucide-react";

export function CourierOrderCard({ order, onAccept, isAccepting }) {
  const distanceKm = order.deliveryDistance
    ? (order.deliveryDistance / 1000).toFixed(1)
    : null;

  const restaurantAddress = order.restaurant?.address
    ? `${order.restaurant.address.street}, ${order.restaurant.address.city}`
    : "Address unavailable";

  const deliveryAddress =
    order.deliveryAddressSnapshot?.fullAddress ?? "Address unavailable";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800">
        <div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ${order.total?.toFixed(2)}
          </span>
          <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
            #{order.orderNumber?.split("-")[2]}
          </span>
        </div>
        {distanceKm && (
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            {distanceKm} km away
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-white dark:bg-zinc-900" />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 dark:text-white">
              {order.restaurant?.name ?? "Restaurant"}
            </p>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {restaurantAddress}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white">
              Customer dropoff
            </p>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {deliveryAddress}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          {order.items?.length === 1
            ? `${order.items[0].quantity}x ${order.items[0].name}`
            : `${order.items?.reduce((s, i) => s + i.quantity, 0)} items`}
        </p>
      </div>

      <button
        onClick={() => onAccept(order._id)}
        disabled={isAccepting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAccepting ? <Spinner /> : "Accept Delivery"}
      </button>
    </div>
  );
}
