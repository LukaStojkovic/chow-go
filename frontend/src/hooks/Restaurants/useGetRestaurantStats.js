import { getRestaurantStats } from "@/services/apiRestaurant";
import { useQuery } from "@tanstack/react-query";

export default function useGetRestaurantStats(restaurantId) {
  const {
    data: restaurantStats,
    isLoading: isLoadingStats,
    error,
  } = useQuery({
    queryKey: ["restaurantStats", restaurantId],
    queryFn: () => getRestaurantStats(restaurantId),
  });

  return { restaurantStats, isLoadingStats, error };
}
