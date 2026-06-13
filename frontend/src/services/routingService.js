import axios from "axios";
import { toOsrmCoord } from "@/utils/mapUtils";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export async function fetchDrivingRoute(fromLatLng, toLatLng) {
  const from = toOsrmCoord(fromLatLng);
  const to = toOsrmCoord(toLatLng);
  if (!from || !to) return null;

  try {
    const response = await axios.get(
      `${OSRM_BASE}/${from};${to}?overview=full&geometries=geojson&steps=true`,
    );

    const data = response.data;
    const route = data.routes?.[0];
    if (!route) return null;

    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [
      lat,
      lng,
    ]);

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    throw new Error("Failed to fetch route");
  }
}
