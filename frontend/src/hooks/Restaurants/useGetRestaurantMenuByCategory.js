import { getRestaurantMenuByCategories } from "@/services/apiRestaurant";
import { useQuery } from "@tanstack/react-query";

export default function useGetRestaurantMenuByCategory(restaurantId) {
  const { data: menu, isLoading: isLoadingMenu } = useQuery({
    queryFn: () => getRestaurantMenuByCategories(restaurantId),
    queryKey: ["restaurant-menu", restaurantId],
  });

  return { menu, isLoadingMenu };
}
