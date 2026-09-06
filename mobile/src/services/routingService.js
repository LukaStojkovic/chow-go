import { toOsrmCoord } from "@chowgo/shared/geo";

// OSRM's public demo server: no key, rate-limited, no SLA. Fine for a route
// line; swap for a hosted instance before this carries real traffic.
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export async function fetchDrivingRoute(fromLatLng, toLatLng) {
  const from = toOsrmCoord(fromLatLng);
  const to = toOsrmCoord(toLatLng);
  if (!from || !to) return null;

  try {
    const response = await fetch(
      `${OSRM_BASE}/${from};${to}?overview=full&geometries=geojson&steps=true`,
    );
    if (!response.ok) return null;

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      // GeoJSON is [lng, lat]; everything above this line works in [lat, lng].
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    return null;
  }
}
