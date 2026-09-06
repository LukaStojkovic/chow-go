import { useQuery } from "@tanstack/react-query";
import { getRestaurantAnalytics, getRestaurantStats } from "@/services/apiRestaurant";
import { useOwnRestaurantId } from "./useMenuItems";

export function useRestaurantStats() {
  const restaurantId = useOwnRestaurantId();

  return useQuery({
    queryKey: ["restaurantStats", restaurantId],
    queryFn: () => getRestaurantStats(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantAnalytics() {
  const restaurantId = useOwnRestaurantId();

  return useQuery({
    queryKey: ["restaurantAnalytics", restaurantId],
    queryFn: () => getRestaurantAnalytics(restaurantId),
    enabled: Boolean(restaurantId),
  });
}
