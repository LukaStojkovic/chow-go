import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { getMenuLayout, saveMenuLayout as saveMenuLayoutApi } from "@/services/apiRestaurant";
import { useAuthStore } from "@/store/useAuthStore";

export const MENU_LAYOUT_KEY = ["menuLayout"];

export function invalidateMenuQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["menuItems"] });
  queryClient.invalidateQueries({ queryKey: MENU_LAYOUT_KEY });
  queryClient.invalidateQueries({ queryKey: ["restaurant-menu"] });
}

function syncRestaurantSections(layout) {
  useAuthStore.setState((state) => {
    const restaurants = state.authUser?.restaurant;
    if (!Array.isArray(restaurants) || !restaurants[0]) return {};
    const menuSections = (layout?.sections ?? []).map(({ _id, name }) => ({ _id, name }));
    return {
      authUser: {
        ...state.authUser,
        restaurant: [{ ...restaurants[0], menuSections }, ...restaurants.slice(1)],
      },
    };
  });
}

export function useMenuLayout({ enabled = true } = {}) {
  return useQuery({
    queryKey: MENU_LAYOUT_KEY,
    queryFn: getMenuLayout,
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function useMenuSections() {
  const fallback = useAuthStore((state) => state.authUser?.restaurant?.[0]?.menuSections);
  const { data } = useMenuLayout();
  const sections = data?.sections ?? fallback ?? [];
  return sections.map(({ _id, name }) => ({ _id: String(_id), name }));
}

export function useSaveMenuLayout() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: saveMenuLayoutApi,
    onSuccess: (layout) => {
      queryClient.setQueryData(MENU_LAYOUT_KEY, layout);
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-menu"] });
      syncRestaurantSections(layout);
      toast.success(t("seller:menuLayout.saved"));
    },
  });

  return { saveMenuLayout: mutate, isSaving: isPending };
}
