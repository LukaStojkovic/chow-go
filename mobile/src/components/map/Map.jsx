import { forwardRef, useMemo } from "react";
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

export const Map = forwardRef(function Map(
  { children, style, initialRegion, fitTo, ...props },
  ref,
) {
  const { isDark } = useTokens();

  const center = initialRegion ? [initialRegion.longitude, initialRegion.latitude] : undefined;

  // Two or more points get a bounding box instead of a centre, so a courier and
  // a customer at opposite ends of a city are both on screen.
  const bounds = useMemo(() => {
    if (!fitTo || fitTo.length < 2) return undefined;
    const lngs = fitTo.map(([, lng]) => lng);
    const lats = fitTo.map(([lat]) => lat);
    return {
      ne: [Math.max(...lngs), Math.max(...lats)],
      sw: [Math.min(...lngs), Math.min(...lats)],
    };
  }, [fitTo]);

  return (
    <MapLibreMap
      ref={ref}
      mapStyle={isDark ? STYLES.dark : STYLES.light}
      style={[{ flex: 1 }, style]}
      logoEnabled={false}
      attributionEnabled
      {...props}
    >
      <Camera
        center={bounds ? undefined : center}
        bounds={bounds}
        padding={
          bounds
            ? { paddingTop: 60, paddingRight: 60, paddingBottom: 60, paddingLeft: 60 }
            : undefined
        }
        zoom={bounds ? undefined : ZOOM_FOR_DELTA(initialRegion?.latitudeDelta ?? 0.01)}
        duration={600}
      />
      {children}
    </MapLibreMap>
  );
});

export function MapMarker({ position, children, id, ...props }) {
  if (!position) return null;

  return (
    <Marker id={id ?? `marker-${position.join(",")}`} lngLat={toLngLat(position)} {...props}>
      {children}
    </Marker>
  );
}

export function RouteLine({ coordinates, color, width = 4 }) {
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
