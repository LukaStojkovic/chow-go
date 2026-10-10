import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMenuLayout, saveMenuLayout } from "@/services/apiRestaurant";
import { useOwnRestaurantId } from "./useMenuItems";

export function useMenuLayout() {
  const restaurantId = useOwnRestaurantId();

  return useQuery({
    queryKey: ["menuLayout", restaurantId],
    queryFn: getMenuLayout,
    enabled: Boolean(restaurantId),
  });
}

export function useSaveMenuLayout() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnRestaurantId();

  return useMutation({
    mutationFn: saveMenuLayout,
    onSuccess: (layout) => {
      queryClient.setQueryData(["menuLayout", restaurantId], layout);
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      queryClient.invalidateQueries({ queryKey: ["menuItem"] });
      queryClient.invalidateQueries({ queryKey: ["ownRestaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurantMenu", restaurantId] });
    },
  });
}
