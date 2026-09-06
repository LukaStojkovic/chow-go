import { useCallback } from "react";
import { router } from "expo-router";
import { useFavourites, useToggleFavourite } from "./useFavourites";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";

/**
 * The heart, from anywhere. Anonymous users are sent to sign in rather than
 * silently failing - favourites live on the account.
 */
export function useFavouriteToggle() {
  const authUser = useAuthStore((state) => state.authUser);
  const { data } = useFavourites();
  const toggle = useToggleFavourite();

  const ids = new Set((data ?? []).map((entry) => String(entry._id)));

  const isFavourite = useCallback((restaurantId) => ids.has(String(restaurantId)), [data]);

  const toggleFavourite = useCallback(
    (restaurantId) => {
      if (!authUser) {
        toast.info("Sign in to save favourites");
        router.push("/(auth)/login");
        return;
      }
      toggle.mutate(String(restaurantId));
    },
    [authUser, toggle],
  );

  return { isFavourite, toggleFavourite };
}
