import { forwardRef } from "react";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { Platform } from "react-native";
import { useTokens } from "@/theme/useTokens";

// The only file that imports the map SDK. Keeping every other screen behind
// this boundary is what makes swapping to Mapbox a day's work rather than a
// refactor - worth revisiting once courier turn-by-turn is a requirement.

export const toRegion = ([lat, lng], delta = 0.01) => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export const toCoordinate = ([lat, lng]) => ({ latitude: lat, longitude: lng });

export const Map = forwardRef(function Map({ children, style, ...props }, ref) {
  const { isDark } = useTokens();

  return (
    <MapView
      ref={ref}
      // Apple Maps on iOS needs no key; Android requires the Google Maps SDK.
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      style={[{ flex: 1 }, style]}
      userInterfaceStyle={isDark ? "dark" : "light"}
      showsUserLocation={false}
      toolbarEnabled={false}
      {...props}
    >
      {children}
    </MapView>
  );
});

export function MapMarker({ position, children, ...props }) {
  if (!position) return null;
  return (
    <Marker coordinate={toCoordinate(position)} tracksViewChanges={false} {...props}>
      {children}
    </Marker>
  );
}

export function RouteLine({ coordinates, color, width = 4 }) {
  if (!coordinates?.length) return null;
  return (
    <Polyline coordinates={coordinates.map(toCoordinate)} strokeColor={color} strokeWidth={width} />
  );
}
