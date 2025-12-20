import { getMenuItems } from "@/services/apiRestaurant";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function useGetMenuItems(
  restaurantId,
  {
    page = 1,
    limit = 12,
    search = "",
    category = "",
    minPrice = "",
    maxPrice = "",
    available = "",
  } = {}
) {
  const queryClient = useQueryClient();

  const queryKey = [
    "menuItems",
    restaurantId,
    page,
    limit,
    search,
    category,
    minPrice,
    maxPrice,
    available,
  ];

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      getMenuItems(restaurantId, {
        page,
        limit,
        search,
        category,
        minPrice,
        maxPrice,
        available,
      }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
    enabled: !!restaurantId,
  });

  const refetchMenu = () => {
    queryClient.invalidateQueries({ queryKey: ["menuItems", restaurantId] });
  };

  return {
    menuItems: data?.menuItems || [],
    pagination: data?.pagination || {},
    isLoading,
    isFetching,
    error,
    refetchMenu,
  };
}
