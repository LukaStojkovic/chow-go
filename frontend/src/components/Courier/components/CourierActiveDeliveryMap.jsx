import { useState } from "react";
import { NavigationMap } from "@/components/Map/NavigationMap";
import { NavigationBanner } from "@/components/Map/NavigationBanner";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { useCourierGeolocation } from "@/hooks/Map/useCourierGeolocation";
import { toLatLng } from "@/utils/mapUtils";

export function CourierActiveDeliveryMap({ order, className = "absolute inset-0" }) {
  const [followMode, setFollowMode] = useState(true);
  const { coords: courierCoords } = useCourierGeolocation(true);

  const restaurantCoords = toLatLng(order.restaurant?.location?.coordinates);
  const deliveryCoords = toLatLng(
    order.deliveryAddressSnapshot?.location?.coordinates,
  );

  const destinationCoords =
    order.status === "assigned" ? restaurantCoords : deliveryCoords;

  const destinationLabel =
    order.status === "assigned"
      ? order.restaurant?.name ?? "Restaurant"
      : "Customer";

  const routeFrom = courierCoords ?? restaurantCoords;
  const { route, isLoadingRoute } = useRouteDirections(
    routeFrom,
    destinationCoords,
    Boolean(routeFrom && destinationCoords),
  );

  return (
    <>
      <NavigationMap
        className={className}
        restaurantCoords={restaurantCoords}
        deliveryCoords={deliveryCoords}
        courierCoords={courierCoords}
        routeCoords={route?.coordinates}
        followCourier={followMode}
      />
      <div className="absolute left-4 right-4 top-16 z-1000">
        <NavigationBanner
          destinationLabel={destinationLabel}
          distance={route?.distance}
          duration={route?.duration}
          isLoadingRoute={isLoadingRoute}
          followMode={followMode}
          onRecenter={() => setFollowMode((v) => !v)}
        />
      </div>
    </>
  );
}
