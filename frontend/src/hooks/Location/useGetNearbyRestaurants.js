import { useQuery } from "@tanstack/react-query";

import { getNearbyRestaurants } from "@/services/apiLocation";
import { toRestaurantViews } from "@/lib/adapters/restaurant";

/**
 * Restaurants within `radius` metres of the customer.
 *
 * This is the only endpoint that returns a real distance (the `$geoNear`
 * pipeline projects `distanceField`), which is why the nearby rail is the only
 * surface that shows one.
 *
 * @param {number | undefined} lat
 * @param {number | undefined} lon
 * @param {number} [radius] Metres. The backend caps this at 100km.
 */
export default function useGetNearbyRestaurants(lat, lon, radius = 20_000) {
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lon);

  const { isLoading, data, error, refetch } = useQuery({
    queryKey: ["nearby-restaurants", lat, lon, radius],
    queryFn: () => getNearbyRestaurants(lat, lon, radius),
    // Without this the query fires with `undefined` coordinates on first paint
    // and the backend answers 400.
    enabled: hasCoordinates,
  });

  return {
    restaurants: toRestaurantViews(data),
    /** @deprecated Prefer `restaurants` - kept for callers not yet migrated. */
    nearbyRestaurants: data,
    isLoading: hasCoordinates && isLoading,
    error,
    refetch,
  };
}
