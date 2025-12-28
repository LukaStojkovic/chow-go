import { getRestaurantInformations } from "@/services/apiRestaurant";
import { useQuery } from "@tanstack/react-query";

export default function useGetRestaurantsInfo(restaurantId) {
  const {
    data: restaurantData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["restaurantInfo", restaurantId],
    queryFn: () => getRestaurantInformations(restaurantId),
  });

  return { restaurantData, isLoading, error };
}
