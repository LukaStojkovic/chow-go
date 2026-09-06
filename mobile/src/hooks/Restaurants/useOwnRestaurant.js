import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOwnRestaurant, updateRestaurant } from "@/services/apiRestaurant";
import { useOwnRestaurantId } from "./useMenuItems";
import { useAuthStore } from "@/store/useAuthStore";

export function useOwnRestaurant() {
  const restaurantId = useOwnRestaurantId();

  return useQuery({
    queryKey: ["ownRestaurant", restaurantId],
    queryFn: () => getOwnRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnRestaurantId();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return useMutation({
    mutationFn: updateRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownRestaurant", restaurantId] });
      // authUser.restaurant[0] is what the socket registration reads, so a
      // stale copy there outlives this screen.
      checkAuth();
    },
  });
}
