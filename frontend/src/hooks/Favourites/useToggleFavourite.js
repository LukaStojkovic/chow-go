import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleFavourite } from "@/services/apiFavourite";

/**
 * Toggle a restaurant in the customer's favourites.
 *
 * Optimistic: the heart fills before the request resolves, because a favourite
 * is low-stakes and a spinner on a heart feels broken. The previous cache is
 * captured in `onMutate` and restored on failure, so a rejected request leaves
 * the UI matching the server rather than silently diverging.
 */
export default function useToggleFavourite() {
  const queryClient = useQueryClient();

  const { mutate: toggleFav, isPending: isTogglingFavourite } = useMutation({
    mutationFn: (restaurantId) => toggleFavourite(restaurantId),

    onMutate: async (restaurantId) => {
      await queryClient.cancelQueries({ queryKey: ["favourites"] });
      const previous = queryClient.getQueryData(["favourites"]);

      queryClient.setQueryData(["favourites"], (old) => {
        const favourites = old?.data?.favourites ?? [];
        const exists = favourites.some((fav) => fav._id === restaurantId);

        return {
          ...old,
          data: {
            ...old?.data,
            favourites: exists
              ? favourites.filter((fav) => fav._id !== restaurantId)
              : // A placeholder id is enough: every consumer only asks whether
                // the id is present. The refetch below fills in the real
                // document.
                [...favourites, { _id: restaurantId }],
          },
        };
      });

      return { previous };
    },

    onError: (error, _restaurantId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["favourites"], context.previous);
      }
      toast.error(
        error?.response?.data?.message || "Could not update your favourites. Try again.",
      );
    },

    onSuccess: (data) => {
      toast.success(
        data?.data?.isFavourited ? "Saved to favourites" : "Removed from favourites",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
    },
  });

  return { toggleFav, isTogglingFavourite };
}
