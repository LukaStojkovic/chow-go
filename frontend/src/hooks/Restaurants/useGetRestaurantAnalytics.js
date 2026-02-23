import { getRestaurantAnalytics } from "@/services/apiRestaurant";
import { useQuery } from "@tanstack/react-query";

export default function useGetRestaurantAnalytics(restaurantId) {
  const {
    data: restaurantAnalytics,
    isLoading: isLoadingAnalytics,
    error,
  } = useQuery({
    queryKey: ["restaurantAnalytics", restaurantId],
    queryFn: () => getRestaurantAnalytics(restaurantId),
  });

  return { restaurantAnalytics, isLoadingAnalytics, error };
}
