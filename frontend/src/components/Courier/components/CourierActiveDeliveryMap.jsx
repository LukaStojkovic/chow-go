import { Suspense, useState } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { lazyNamed } from "@/lib/lazyNamed";

const NavigationMap = lazyNamed(
  () => import("@/components/Map/NavigationMap"),
  "NavigationMap",
);
import { NavigationBanner } from "@/components/Map/NavigationBanner";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { useCourierLocation } from "@/contexts/CourierLocationContext";
import { haversineMeters, toLatLng } from "@/utils/mapUtils";

export function CourierActiveDeliveryMap({
  order,
  className = "absolute inset-0",
}) {
  const [followMode, setFollowMode] = useState(true);
  const {
    coords: courierCoords,
    isDenied,
    isUnsupported,
    isTracking,
  } = useCourierLocation();

  const restaurantCoords = toLatLng(order.restaurant?.location?.coordinates);
  const deliveryCoords = toLatLng(
    order.deliveryAddressSnapshot?.location?.coordinates,
  );

  const headingToRestaurant = order.status === "assigned";
  const destinationCoords = headingToRestaurant
    ? restaurantCoords
    : deliveryCoords;

  const destinationLabel = headingToRestaurant
    ? (order.restaurant?.name ?? "Restaurant")
    : (order.deliveryAddressSnapshot?.fullAddress ?? "Customer");

  const routeFrom =
    courierCoords ?? (headingToRestaurant ? null : restaurantCoords);

  const canRoute = Boolean(
    routeFrom &&
      destinationCoords &&
      haversineMeters(routeFrom, destinationCoords) > 25,
  );

  const { route, isLoadingRoute, routeError } = useRouteDirections(
    routeFrom,
    destinationCoords,
    canRoute,
  );

  const fallbackDistance =
    !route && routeFrom && destinationCoords
      ? haversineMeters(routeFrom, destinationCoords)
      : null;

  const waitingForFix = !courierCoords && !isDenied && !isUnsupported;

  return (
    <>
      <Suspense
        fallback={<div className={`${className} animate-pulse bg-muted`} />}
      >
        <NavigationMap
          className={className}
          restaurantCoords={restaurantCoords}
          deliveryCoords={deliveryCoords}
          courierCoords={courierCoords}
          routeCoords={route?.coordinates}
          followCourier={followMode && Boolean(courierCoords)}
        />
      </Suspense>

      <div className="absolute left-4 right-4 top-16 z-1000 space-y-2">
        <NavigationBanner
          destinationLabel={destinationLabel}
          distance={route?.distance ?? fallbackDistance}
          duration={route?.duration}
          isApproximate={!route && fallbackDistance != null}
          isLoadingRoute={isLoadingRoute}
          followMode={followMode}
          onRecenter={courierCoords ? () => setFollowMode((v) => !v) : undefined}
        />

        {(waitingForFix || isDenied || isUnsupported || routeError) && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-card/95 px-4 py-3 text-sm shadow-lg backdrop-blur-sm">
            {waitingForFix ? (
              <>
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isTracking
                    ? "Getting your location…"
                    : "Location tracking is off."}
                </p>
              </>
            ) : isDenied || isUnsupported ? (
              <>
                <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="font-medium text-destructive">
                  Location is blocked, so the route and the customer's live
                  tracking cannot update.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Route unavailable right now — showing direct distance. Retrying.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
