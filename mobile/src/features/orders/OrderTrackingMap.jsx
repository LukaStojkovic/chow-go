import { useMemo } from "react";
import { View } from "react-native";
import { Bike, MapPin, Store } from "lucide-react-native";
import { formatDistance, formatDuration, toLatLng } from "@chowgo/shared/geo";
import { Map, MapMarker, RouteLine, toRegion } from "@/components/map/Map";
import { Text } from "@/components/ui/Text";
import { useCourierLocation } from "@/hooks/Map/useCourierLocation";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { useTokens } from "@/theme/useTokens";

const LIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

function Pin({ icon: Icon, color, background }) {
  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full border-2 border-scrim-foreground"
      style={{ backgroundColor: background }}
    >
      <Icon size={16} color={color} />
    </View>
  );
}

// Takes the raw order, not the view model: the shared adapter deliberately
// drops coordinates, and every position here is GeoJSON [lng, lat].
export function OrderTrackingMap({ order }) {
  const { color } = useTokens();

  const restaurant = toLatLng(order?.restaurant?.location?.coordinates);
  const destination = toLatLng(order?.deliveryAddressSnapshot?.location?.coordinates);
  const { position: courier, isStale } = useCourierLocation(
    order?._id,
    order?.courier?.currentLocation?.coordinates,
  );

  // Before pickup the courier is heading to the restaurant, after it to the
  // customer. Routing to the wrong end draws a line going the wrong way.
  const target = order?.status === "assigned" ? restaurant : destination;
  const route = useRouteDirections(courier, target);

  const framed = useMemo(
    () => [courier, restaurant, destination].filter(Boolean),
    [courier, restaurant, destination],
  );

  if (!LIVE_STATUSES.includes(order?.status) || !courier) return null;

  return (
    <View className="h-64 overflow-hidden rounded-md border border-border">
      <Map initialRegion={toRegion(courier)} fitTo={framed}>
        <RouteLine coordinates={route?.coordinates} color={color.primary} />
        <MapMarker position={restaurant} title={order?.restaurant?.name}>
          <Pin icon={Store} color={color["primary-foreground"]} background={color.primary} />
        </MapMarker>
        <MapMarker position={destination} title="Delivery address">
          <Pin icon={MapPin} color={color["info-foreground"]} background={color.info} />
        </MapMarker>
        <MapMarker position={courier} title="Courier">
          <Pin icon={Bike} color={color.foreground} background={color.card} />
        </MapMarker>
      </Map>

      {route || isStale ? (
        <View className="absolute bottom-2 left-2 right-2 flex-row items-center justify-between rounded-sm bg-popover px-3 py-2">
          <Text variant="body-sm" tone={isStale ? "muted" : "foreground"}>
            {isStale ? "Waiting for a fresh location…" : `${formatDistance(route.distance)} away`}
          </Text>
          {route && !isStale ? <Text variant="label">{formatDuration(route.duration)}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
