import { useQuery } from "@tanstack/react-query";
import { getRestaurantInfo, getRestaurantMenu } from "@/services/apiRestaurant";

export function useRestaurant(restaurantId) {
  const info = useQuery({
    queryKey: ["restaurantInfo", restaurantId],
    queryFn: () => getRestaurantInfo(restaurantId),
    enabled: Boolean(restaurantId),
  });

  const menu = useQuery({
    queryKey: ["restaurantMenu", restaurantId],
    queryFn: () => getRestaurantMenu(restaurantId),
    enabled: Boolean(restaurantId),
  });

  return { info, menu };
}
