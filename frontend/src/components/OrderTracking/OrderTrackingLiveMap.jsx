import { Bike, MapPin, UtensilsCrossed } from "lucide-react";
import { NavigationMap } from "@/components/Map/NavigationMap";
import { useOrderCourierLocation } from "@/hooks/Map/useOrderCourierLocation";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { formatDistance, formatDuration, toLatLng } from "@/utils/mapUtils";

const LIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

export function OrderTrackingLiveMap({ orderId, order }) {
  const showLive = order.courier && LIVE_STATUSES.includes(order.status);
  console.log(order, LIVE_STATUSES.includes(order.status));
  const restaurantCoords = toLatLng(order.restaurant?.location?.coordinates);
  const deliveryCoords = toLatLng(
    order.deliveryAddressSnapshot?.location?.coordinates,
  );
  const courierCoords = useOrderCourierLocation(orderId, order.courier);

  const routeFrom = courierCoords ?? restaurantCoords;
  const routeTo = deliveryCoords;
  const { route, isLoadingRoute } = useRouteDirections(
    routeFrom,
    routeTo,
    showLive && Boolean(routeFrom && routeTo),
  );

  const hasAnyCoords = restaurantCoords || deliveryCoords;
  if (!hasAnyCoords && !showLive) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {showLive ? (
            <>
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Live tracking
              </h3>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 text-gray-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                Order map
              </h3>
            </>
          )}
        </div>
        {showLive && !isLoadingRoute && route && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistance(route.distance)} · {formatDuration(route.duration)}
          </p>
        )}
      </div>

      <div className="relative h-56 w-full sm:h-72">
        <NavigationMap
          restaurantCoords={restaurantCoords}
          deliveryCoords={deliveryCoords}
          courierCoords={showLive ? courierCoords : null}
          routeCoords={showLive ? route?.coordinates : null}
          followCourier={false}
          className="absolute inset-0"
        />
      </div>

      <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-zinc-800 dark:text-gray-400">
        {restaurantCoords && (
          <span className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-500" />
            Restaurant
          </span>
        )}
        {showLive && (
          <span className="flex items-center gap-1.5">
            <Bike className="h-3.5 w-3.5 text-blue-500" />
            {order.courier?.fullName ?? "Courier"}
          </span>
        )}
        {deliveryCoords && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-red-500" />
            Drop-off
          </span>
        )}
      </div>
    </div>
  );
}
