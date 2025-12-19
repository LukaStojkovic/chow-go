import { useQuery } from "@tanstack/react-query";
import { getMenuItems as getMenuItemsApi } from "@/services/apiRestaurant";

export default function useGetMenuItems(restaurantId) {
  const { data, isLoading, error } = useQuery({
    queryFn: () => getMenuItemsApi(restaurantId),
    queryKey: ["menuItems"],
  });

  return { data, isLoading, error };
}
