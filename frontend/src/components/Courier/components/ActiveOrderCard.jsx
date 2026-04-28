import { CheckCircle, MapPin, Navigation } from "lucide-react";

const STATUS_CONFIG = {
  assigned: {
    label: "Heading to restaurant",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    nextAction: "Picked Up",
    nextIcon: CheckCircle,
  },
  picked_up: {
    label: "Order picked up",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    nextAction: "Start Delivery",
    nextIcon: Navigation,
  },
  in_transit: {
    label: "On the way",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    nextAction: "Mark Delivered",
    nextIcon: CheckCircle,
  },
};

export function ActiveOrderCard({ order }) {
  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.assigned;
  const NextIcon = config.nextIcon;

  const restaurantAddress = order.restaurant?.address
    ? `${order.restaurant.address.street}, ${order.restaurant.address.city}`
    : "Address unavailable";

  const deliveryAddress =
    order.deliveryAddressSnapshot?.fullAddress ?? "Address unavailable";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`px-5 py-3 ${config.bg}`}>
        <span className={`text-sm font-bold uppercase ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {order.restaurant?.name ?? "Restaurant"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              #{order.orderNumber?.split("-")[2]}
            </p>
          </div>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ${order.total?.toFixed(2)}
          </span>
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-emerald-500 bg-white dark:bg-zinc-900" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {restaurantAddress}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                {deliveryAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-900 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
            <Navigation className="h-5 w-5" />
            Navigate
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700">
            <NextIcon className="h-5 w-5" />
            {config.nextAction}
          </button>
        </div>
      </div>
    </div>
  );
}
