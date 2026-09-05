import { Suspense } from "react";
import { Bike, MapPin, UtensilsCrossed } from "lucide-react";
import { lazyNamed } from "@/lib/lazyNamed";
import { useOrderCourierLocation } from "@/hooks/Map/useOrderCourierLocation";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { formatDistance, formatDuration, toLatLng } from "@/utils/mapUtils";

const NavigationMap = lazyNamed(
  () => import("@/components/Map/NavigationMap"),
  "NavigationMap",
);

const LIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

export function OrderTrackingLiveMap({ orderId, order }) {
  const showLive = Boolean(order.courier) && LIVE_STATUSES.includes(order.status);

  const restaurantCoords = toLatLng(order.restaurant?.location?.coordinates);
  const deliveryCoords = toLatLng(
    order.deliveryAddressSnapshot?.location?.coordinates,
  );
  const { coords: courierCoords, isStale } = useOrderCourierLocation(
    orderId,
    order.courier,
  );

  const headingToRestaurant = order.status === "assigned";
  const routeFrom = courierCoords ?? (headingToRestaurant ? null : restaurantCoords);
  const routeTo = headingToRestaurant ? restaurantCoords : deliveryCoords;

  const { route } = useRouteDirections(
    routeFrom,
    routeTo,
    showLive && Boolean(routeFrom && routeTo),
  );

  const hasAnyCoords = restaurantCoords || deliveryCoords;
  if (!hasAnyCoords && !showLive) return null;

  const liveLabel = headingToRestaurant
    ? "Heading to the restaurant"
    : "On the way to you";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 ">
        <div className="flex min-w-0 items-center gap-2">
          {showLive ? (
            <>
              <div className="relative flex h-2.5 w-2.5 shrink-0">
                {!isStale && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isStale ? "bg-muted-foreground" : "bg-primary"
                  }`}
                />
              </div>
              <h3 className="truncate font-bold text-foreground ">
                {isStale ? "Last known position" : liveLabel}
              </h3>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h3 className="font-bold text-foreground ">Order map</h3>
            </>
          )}
        </div>

        {showLive && route && !headingToRestaurant && (
          <p className="shrink-0 text-sm text-muted-foreground ">
            {formatDistance(route.distance)} · {formatDuration(route.duration)}
          </p>
        )}
      </div>

      <div className="relative h-56 w-full sm:h-72">
        <Suspense
          fallback={<div className="absolute inset-0 animate-pulse bg-muted" />}
        >
          <NavigationMap
            restaurantCoords={restaurantCoords}
            deliveryCoords={deliveryCoords}
            courierCoords={showLive ? courierCoords : null}
            routeCoords={showLive ? route?.coordinates : null}
            followCourier={false}
            className="absolute inset-0"
          />
        </Suspense>
      </div>

      <div className="flex items-center gap-4 border-t border-border px-5 py-3 text-xs text-muted-foreground ">
        {restaurantCoords && (
          <span className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
            Restaurant
          </span>
        )}
        {showLive && (
          <span className="flex items-center gap-1.5">
            <Bike className="h-3.5 w-3.5 text-primary" />
            {order.courier?.fullName ?? "Courier"}
          </span>
        )}
        {deliveryCoords && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-destructive" />
            Drop-off
          </span>
        )}
      </div>
    </div>
  );
}
