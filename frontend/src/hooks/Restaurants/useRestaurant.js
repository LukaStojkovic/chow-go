import { useQuery } from "@tanstack/react-query";

import {
  getRestaurantInformations,
  getRestaurantMenuByCategories,
} from "@/services/apiRestaurant";
import { toRestaurantView } from "@chowgo/shared/adapters/restaurant";
import { toMenuSections } from "@chowgo/shared/adapters/menu";

/**
 * A restaurant and its menu, as view models.
 *
 * Two queries rather than one so the header can paint as soon as the
 * restaurant document lands - the menu is the larger payload and would
 * otherwise hold up the whole screen.
 *
 * @param {string | undefined} restaurantId
 */
export function useRestaurant(restaurantId) {
  const restaurantQuery = useQuery({
    queryKey: ["restaurantInfo", restaurantId],
    queryFn: () => getRestaurantInformations(restaurantId),
    enabled: Boolean(restaurantId),
  });

  const menuQuery = useQuery({
    queryKey: ["restaurant-menu", restaurantId],
    queryFn: () => getRestaurantMenuByCategories(restaurantId),
    enabled: Boolean(restaurantId),
  });

  return {
    restaurant: toRestaurantView(restaurantQuery.data),
    menu: toMenuSections(menuQuery.data),
    isLoadingRestaurant: restaurantQuery.isLoading,
    isLoadingMenu: menuQuery.isLoading,
    error: restaurantQuery.error,
    refetch: () => {
      restaurantQuery.refetch();
      menuQuery.refetch();
    },
  };
}
