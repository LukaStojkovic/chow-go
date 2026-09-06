import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  updateMenuItem,
} from "@/services/apiRestaurant";
import { useAuthStore } from "@/store/useAuthStore";

// The seller's restaurant populates as an array - it is a virtual on User, and
// virtuals have no setter, so the link lives on Restaurant.ownerId.
export function useOwnRestaurantId() {
  return useAuthStore((state) => state.authUser?.restaurant?.[0]?._id ?? null);
}

export function useMenuItems(filters) {
  const restaurantId = useOwnRestaurantId();

  return useQuery({
    queryKey: ["menuItems", restaurantId, filters],
    queryFn: () => getMenuItems(restaurantId, filters),
    enabled: Boolean(restaurantId),
  });
}

function useMenuMutation(mutationFn) {
  const queryClient = useQueryClient();
  const restaurantId = useOwnRestaurantId();

  return useMutation({
    mutationFn: (variables) => mutationFn(restaurantId, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      // The customer-facing menu reads a different endpoint entirely.
      queryClient.invalidateQueries({ queryKey: ["restaurantMenu", restaurantId] });
    },
  });
}

export const useCreateMenuItem = () =>
  useMenuMutation((restaurantId, payload) => createMenuItem(restaurantId, payload));

export const useUpdateMenuItem = () =>
  useMenuMutation((restaurantId, { menuItemId, ...payload }) =>
    updateMenuItem(restaurantId, menuItemId, payload),
  );

export const useDeleteMenuItem = () =>
  useMenuMutation((restaurantId, menuItemId) => deleteMenuItem(restaurantId, menuItemId));
