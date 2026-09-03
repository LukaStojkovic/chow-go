import { useCallback } from "react";

import useGetFavourites from "./useGetFavourites";
import useToggleFavourite from "./useToggleFavourite";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Favourites, as every card and header needs them: a membership test and a
 * toggle. Wrapping the two hooks here means a grid of 24 cards runs one query,
 * not one per card.
 *
 * Signing in is a precondition, so an anonymous visitor pressing a heart gets
 * the auth modal rather than a failed request.
 *
 * @returns {{
 *   isFavourite: (restaurantId: string) => boolean,
 *   toggleFavourite: (restaurantId: string) => void,
 *   isPending: boolean,
 *   favourites: Object[],
 *   isLoading: boolean,
 * }}
 */
export function useFavourites() {
  const { authUser, openAuthModal } = useAuthStore();
  const { favourites, isLoadingFavourites } = useGetFavourites();
  const { toggleFav, isTogglingFavourite } = useToggleFavourite();

  const isFavourite = useCallback(
    (restaurantId) => favourites.some((fav) => fav._id === restaurantId),
    [favourites],
  );

  const toggleFavourite = useCallback(
    (restaurantId) => {
      if (!authUser) {
        openAuthModal(true);
        return;
      }
      toggleFav(restaurantId);
    },
    [authUser, openAuthModal, toggleFav],
  );

  return {
    isFavourite,
    toggleFavourite,
    isPending: isTogglingFavourite,
    favourites,
    isLoading: isLoadingFavourites,
  };
}
