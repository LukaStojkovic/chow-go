import { useMemo } from "react";
import { View } from "react-native";
import { Bike, MapPin, Store } from "lucide-react-native";
import { formatDistance, formatDuration, toLatLng } from "@chowgo/shared/geo";
import { Map, MapMarker, RouteLine, toRegion } from "@/components/map/Map";
import { StatusDot } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { useCourierLocation } from "@/hooks/Map/useCourierLocation";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { useTokens } from "@/theme/useTokens";

const LIVE_STATUSES = ["assigned", "picked_up", "in_transit"];

// Pins get a white ring so they stay legible over any part of the map -
// buildings, parks and water all sit at different lightnesses.
function Pin({ icon: Icon, color, background, size = 40 }) {
  return (
    <View
      style={{ width: size, height: size, backgroundColor: background }}
      className="items-center justify-center rounded-full border-[3px] border-scrim-foreground"
    >
      <Icon size={Math.round(size * 0.44)} color={color} />
    </View>
  );
}

// Takes the raw order, not the view model: the shared adapter deliberately
// drops coordinates, and every position here is GeoJSON [lng, lat].
export function OrderTrackingMap({ order }) {
  const { color, elevation, scheme } = useTokens();

  const restaurant = toLatLng(order?.restaurant?.location?.coordinates);
  const destination = toLatLng(order?.deliveryAddressSnapshot?.location?.coordinates);
  const { position: courier, isStale } = useCourierLocation(
    order?._id,
    order?.courier?.currentLocation?.coordinates,
  );

  // Before pickup the courier is heading to the restaurant, after it to the
  // customer. Routing to the wrong end draws a line going the wrong way.
  const target = order?.status === "assigned" ? restaurant : destination;
  const { route } = useRouteDirections(courier, target);

  const framed = useMemo(
    () => [courier, restaurant, destination].filter(Boolean),
    [courier, restaurant, destination],
  );

  if (!LIVE_STATUSES.includes(order?.status) || !courier) return null;

  return (
    <View style={elevation.subtle[scheme]} className="h-72 overflow-hidden rounded-lg bg-card">
      <Map
        initialRegion={toRegion(courier)}
        fitTo={framed}
        attributionPosition={{ top: 8, left: 8 }}
      >
        <RouteLine coordinates={route?.coordinates} color={color["primary-bright"]} />
        <MapMarker position={restaurant} title={order?.restaurant?.name}>
          <Pin
            icon={Store}
            color={color["primary-foreground"]}
            background={color.primary}
            size={36}
          />
        </MapMarker>
        <MapMarker position={destination} title="Delivery address">
          <Pin icon={MapPin} color={color["info-foreground"]} background={color.info} size={36} />
        </MapMarker>
        <MapMarker position={courier} title="Courier">
          <Pin
            icon={Bike}
            color={color["primary-foreground"]}
            background={color["primary-bright"]}
          />
        </MapMarker>
      </Map>

      {route || isStale ? (
        <View
          style={elevation.raised[scheme]}
          className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between rounded-full bg-card px-4 py-3"
        >
          <View className="flex-row items-center gap-2">
            <StatusDot tone={isStale ? "muted" : "success"} />
            <Text variant="label" tone={isStale ? "muted" : "foreground"}>
              {isStale ? "Waiting for a fresh location…" : `${formatDistance(route.distance)} away`}
            </Text>
          </View>
          {route && !isStale ? (
            <View className="rounded-full bg-primary-subtle px-3 py-1.5">
              <Text variant="label-sm" tone="primary">
                {formatDuration(route.duration)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
