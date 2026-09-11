import { forwardRef, useCallback, useMemo } from "react";
import { View } from "react-native";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  Marker,
} from "@maplibre/maplibre-react-native";
import { useTokens } from "@/theme/useTokens";

/**
 * The only file that imports the map SDK.
 *
 * MapLibre against OpenFreeMap: no API key, no billing account, and the same
 * cartography on both platforms — Apple Maps on iOS next to Google Maps on
 * Android looked like two different products. OpenFreeMap serves OpenStreetMap
 * data as vector tiles for free with no signup and no usage caps.
 *
 * Callers pass [lat, lng], matching @chowgo/shared/geo#toLatLng and every other
 * position in the app. MapLibre wants GeoJSON [lng, lat], so the flip happens
 * here and nowhere else.
 */
const STYLES = {
  light: "https://tiles.openfreemap.org/styles/bright",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

const toLngLat = ([lat, lng]) => [lng, lat];

/** Kept for the callers that still speak in regions. */
export const toRegion = ([lat, lng], delta = 0.01) => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export const toCoordinate = ([lat, lng]) => ({ latitude: lat, longitude: lng });

const ZOOM_FOR_DELTA = (delta) => Math.round(Math.log2(360 / Math.max(delta, 0.001)));

// Roughly a metre. Below this a "box" is really one point, and fitting to it
// would drive the camera to maximum zoom.
const MIN_SPAN_DEG = 0.00002;
const POINT_ZOOM = 15;

export const Map = forwardRef(function Map(
  { children, style, initialRegion, fitTo, onMapPress, ...props },
  ref,
) {
  const { isDark } = useTokens();

  // The native event carries GeoJSON [lng, lat]; callers get [lat, lng] like
  // every other position they hand this component.
  const handlePress = useCallback(
    (event) => {
      const [lng, lat] = event?.nativeEvent?.lngLat ?? [];
      if (lat != null && lng != null) onMapPress([lat, lng]);
    },
    [onMapPress],
  );

  // Two or more points get a bounding box instead of a centre, so a courier and
  // a customer at opposite ends of a city are both on screen.
  //
  // The native camera stop wants `bounds` as a flat [west, south, east, north]
  // array of numbers. Handing it the {ne, sw} object this used to build threw
  // "Value for bounds cannot be cast from ReadableNativeMap to ReadableArray"
  // and took the whole app down the moment a two-point map was created.
  const stop = useMemo(() => {
    const points = (fitTo ?? []).filter(Boolean);

    if (points.length > 1) {
      const lngs = points.map(([, lng]) => lng);
      const lats = points.map(([lat]) => lat);
      const west = Math.min(...lngs);
      const east = Math.max(...lngs);
      const south = Math.min(...lats);
      const north = Math.max(...lats);

      if (east - west > MIN_SPAN_DEG || north - south > MIN_SPAN_DEG) {
        return { bounds: [west, south, east, north] };
      }
      // Every point is the same place - a courier standing at the restaurant.
      return { center: toLngLat(points[0]), zoom: POINT_ZOOM };
    }

    if (points.length === 1) return { center: toLngLat(points[0]), zoom: POINT_ZOOM };

    if (initialRegion) {
      return {
        center: [initialRegion.longitude, initialRegion.latitude],
        zoom: ZOOM_FOR_DELTA(initialRegion.latitudeDelta ?? 0.01),
      };
    }

    return {};
    // Regions are rebuilt inline by every caller, so the identity of the object
    // says nothing; the numbers in it do.
  }, [fitTo, initialRegion?.latitude, initialRegion?.longitude, initialRegion?.latitudeDelta]);

  return (
    <MapLibreMap
      ref={ref}
      mapStyle={isDark ? STYLES.dark : STYLES.light}
      style={[{ flex: 1 }, style]}
      // `logoEnabled`/`attributionEnabled` were the v10 names and did nothing
      // here, so the MapLibre logo has been drawing on every map since the
      // migration. Attribution stays on - OSM's licence asks for it - but a
      // caller that covers the default bottom-left corner should move it with
      // `attributionPosition`.
      logo={false}
      attribution
      onPress={onMapPress ? handlePress : undefined}
      {...props}
    >
      <Camera
        {...stop}
        // Pixel insets, and the native prop is {top, right, bottom, left} - the
        // CSS-style names it had before were dropped on the floor.
        padding={stop.bounds ? { top: 60, right: 60, bottom: 60, left: 60 } : undefined}
        duration={600}
      />
      {children}
    </MapLibreMap>
  );
});

export function MapMarker({ position, children, id, title, tone = "primary", ...props }) {
  if (!position) return null;

  return (
    <Marker
      id={id ?? `marker-${position.join(",")}`}
      lngLat={toLngLat(position)}
      // The SDK has no tooltip on native, so a `title` would render nowhere.
      // Spent on the screen reader instead, which is the only thing that was
      // ever going to read it out.
      accessibilityLabel={title}
      {...props}
    >
      {children ?? <DefaultPin tone={tone} />}
    </Marker>
  );
}

/**
 * The pin a caller gets when it does not supply its own.
 *
 * A white ring around a filled dot, because a marker has to survive over
 * buildings, parks and water - all of which sit at different lightnesses, and
 * none of which a single flat colour reads against reliably.
 */
function DefaultPin({ tone }) {
  const { color } = useTokens();
  const fill = tone === "info" ? color.info : color["primary-bright"];

  return (
    <View
      style={{ backgroundColor: fill }}
      className="h-5 w-5 rounded-full border-[3px] border-scrim-foreground"
    />
  );
}

export function RouteLine({ coordinates, color, width = 5 }) {
  const data = useMemo(() => {
    if (!coordinates?.length) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coordinates.map(toLngLat) },
    };
  }, [coordinates]);

  if (!data) return null;

  return (
    <GeoJSONSource id="route" data={data} lineMetrics>
      <Layer
        id="route-line"
        type="line"
        layout={{ lineCap: "round", lineJoin: "round" }}
        paint={{ lineColor: color, lineWidth: width }}
      />
    </GeoJSONSource>
  );
}
