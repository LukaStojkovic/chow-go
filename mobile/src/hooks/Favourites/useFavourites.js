import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavourites, toggleFavourite } from "@/services/apiFavourite";
import { useAuthStore } from "@/store/useAuthStore";

const KEY = ["favourites"];

export function useFavourites() {
  const authUser = useAuthStore((state) => state.authUser);
  return useQuery({ queryKey: KEY, queryFn: getFavourites, enabled: Boolean(authUser) });
}

export function useToggleFavourite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavourite,
    // Optimistic: a heart that waits for a round trip feels broken.
    onMutate: async (restaurantId) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData(KEY);

      queryClient.setQueryData(KEY, (current) => {
        if (!Array.isArray(current)) return current;
        const saved = current.some((entry) => String(entry._id) === String(restaurantId));
        // Adding inserts a stub: the card that triggered this already has the
        // restaurant on screen, and the refetch replaces it moments later.
        return saved
          ? current.filter((entry) => String(entry._id) !== String(restaurantId))
          : [...current, { _id: restaurantId }];
      });

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
