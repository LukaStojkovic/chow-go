import { getNearbyRestaurants } from "@/services/apiLocation";
import { useQuery } from "@tanstack/react-query";

export default function useGetNearbyRestaurants(lat, lon, radius = 20_000) {
  const {
    isLoading,
    data: nearbyRestaurants,
    error,
  } = useQuery({
    queryKey: ["nearby-restaurants", lat, lon, radius],
    queryFn: () => getNearbyRestaurants(lat, lon, radius),
  });

  return { isLoading, nearbyRestaurants, error };
}
