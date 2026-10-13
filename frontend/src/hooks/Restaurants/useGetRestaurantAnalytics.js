import { getRestaurantAnalytics } from "@/services/apiRestaurant";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export default function useGetRestaurantAnalytics(restaurantId, range = {}) {
  const params = range.preset ? { preset: range.preset } : { from: range.from, to: range.to };
  const {
    data: restaurantAnalytics,
    isLoading: isLoadingAnalytics,
    isFetching: isFetchingAnalytics,
    error,
  } = useQuery({
    queryKey: ["restaurantAnalytics", restaurantId, params.preset ?? null, params.from ?? null, params.to ?? null],
    queryFn: () => getRestaurantAnalytics(restaurantId, params),
    enabled: Boolean(restaurantId),
    placeholderData: keepPreviousData,
  });

  return { restaurantAnalytics, isLoadingAnalytics, isFetchingAnalytics, error };
}
