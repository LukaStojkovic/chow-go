import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Clock, MapPinOff, Navigation, Store } from "lucide-react-native";
import { formatDistance, formatDuration, haversineMeters } from "@chowgo/shared/geo";
import { Map, MapMarker, RouteLine, toRegion } from "@/components/map/Map";
import { Text } from "@/components/ui/Text";
import { useRouteDirections } from "@/hooks/Map/useRouteDirections";
import { useTokens } from "@/theme/useTokens";

// Close enough that a route is noise - the courier is standing at the door.
const ARRIVED_M = 25;
const FOLLOW_DELTA = 0.004;

/**
 * The courier's own navigation view.
 *
 * The web version of this screen has had a live route since it shipped; the
 * app had two static markers, which told a courier nothing they could not see
 * from the address. The route is drawn from the courier's own GPS to whichever
 * end of the job is next, and follows them as they move.
 *
 * Follow mode is a toggle rather than a permanent lock: a courier looking for
 * an entrance needs to pan around the block without the camera dragging them
 * back every four seconds.
 */
export function DeliveryNavigationMap({
  status,
  restaurant,
  destination,
  destinationLabel,
  courier,
  isTracking,
  isDenied,
  topOffset = 0,
}) {
  const { color, elevation, scheme } = useTokens();
  const [follow, setFollow] = useState(true);

  const headingToRestaurant = status === "assigned";
  const target = headingToRestaurant ? restaurant : destination;

  // Before the first fix there is still a useful line to draw for the second
  // leg: the food is at the restaurant, so that is where the courier is.
  const origin = courier ?? (headingToRestaurant ? null : restaurant);

  const directDistance = origin && target ? haversineMeters(origin, target) : null;
  const canRoute = Boolean(origin && target && directDistance > ARRIVED_M);

  const { route, isLoading, error } = useRouteDirections(origin, target, canRoute);

  const framed = useMemo(
    () => [courier, restaurant, destination].filter(Boolean),
    [courier, restaurant, destination],
  );

  const following = follow && Boolean(courier);
  const waitingForFix = !courier && !isDenied;

  return (
    <View className="flex-1">
      <Map
        initialRegion={following ? toRegion(courier, FOLLOW_DELTA) : undefined}
        fitTo={following ? undefined : framed}
        attributionPosition={{ top: Math.max(topOffset - 46, 8), right: 14 }}
      >
        <RouteLine coordinates={route?.coordinates} color={color["primary-bright"]} />

        <MapMarker id="pickup" position={restaurant} title="Pickup">
          <Pin
            icon={Store}
            background={headingToRestaurant ? color.primary : color.muted}
            tint={headingToRestaurant ? color["primary-foreground"] : color["muted-foreground"]}
          />
        </MapMarker>

        <MapMarker id="dropoff" position={destination} title="Delivery address">
          <Pin
            icon={Navigation}
            background={headingToRestaurant ? color.muted : color.info}
            tint={headingToRestaurant ? color["muted-foreground"] : color["info-foreground"]}
          />
        </MapMarker>

        <MapMarker id="courier" position={courier} title="You">
          <View
            style={{ backgroundColor: color["primary-bright"] }}
            className="h-6 w-6 rounded-full border-[3px] border-scrim-foreground"
          />
        </MapMarker>
      </Map>

      <View
        pointerEvents="box-none"
        style={{ top: topOffset }}
        className="absolute left-5 right-5 gap-2"
      >
        <View
          style={elevation.raised[scheme]}
          className="flex-row items-center gap-3 rounded-lg bg-card px-3.5 py-3"
        >
          <View className="h-10 w-10 items-center justify-center rounded-md bg-primary-subtle">
            <Navigation size={18} color={color.primary} />
          </View>

          <View className="min-w-0 flex-1">
            <Text variant="overline" tone="muted">
              Navigating to
            </Text>
            <Text variant="h3" numberOfLines={1}>
              {destinationLabel}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              {isLoading && !route ? (
                <ActivityIndicator size="small" color={color["muted-foreground"]} />
              ) : (
                <>
                  {(route?.distance ?? directDistance) != null ? (
                    <Text variant="caption" tone="muted">
                      {route ? "" : "~"}
                      {formatDistance(route?.distance ?? directDistance)}
                      {route ? "" : " direct"}
                    </Text>
                  ) : null}
                  {route?.duration != null ? (
                    <>
                      <Text variant="caption" tone="muted">
                        ·
                      </Text>
                      <Clock size={11} color={color["muted-foreground"]} />
                      <Text variant="caption" tone="muted">
                        {formatDuration(route.duration)}
                      </Text>
                    </>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {courier ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: follow }}
              accessibilityLabel={follow ? "Stop following your position" : "Recentre on you"}
              onPress={() => setFollow((value) => !value)}
              className={`h-9 shrink-0 items-center justify-center rounded-full px-3.5 active:opacity-70 ${
                follow ? "bg-primary" : "bg-muted"
              }`}
            >
              <Text variant="label-sm" tone={follow ? "inverse" : "muted"}>
                {follow ? "Following" : "Recentre"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {waitingForFix || isDenied || (error && !route) ? (
          <View
            style={elevation.raised[scheme]}
            className="flex-row items-center gap-2.5 rounded-lg bg-card px-3.5 py-2.5"
          >
            {waitingForFix ? (
              <>
                <ActivityIndicator size="small" color={color["muted-foreground"]} />
                <Text variant="body-sm" tone="muted" className="flex-1">
                  {isTracking ? "Getting your location…" : "Location tracking is off."}
                </Text>
              </>
            ) : isDenied ? (
              <>
                <MapPinOff size={16} color={color.destructive} />
                <Text variant="body-sm" tone="destructive" className="flex-1">
                  Location is blocked, so the route and the customer's tracking cannot update.
                </Text>
              </>
            ) : (
              <Text variant="body-sm" tone="muted" className="flex-1">
                Route unavailable right now — showing direct distance. Retrying.
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// A white ring keeps a pin legible over buildings, parks and water, which all
// sit at different lightnesses.
function Pin({ icon: Icon, background, tint }) {
  return (
    <View
      style={{ backgroundColor: background }}
      className="h-9 w-9 items-center justify-center rounded-full border-[3px] border-scrim-foreground"
    >
      <Icon size={16} color={tint} />
    </View>
  );
}
