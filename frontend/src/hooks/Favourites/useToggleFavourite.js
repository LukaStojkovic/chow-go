import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleFavourite } from "@/services/apiFavourite";

export default function useToggleFavourite() {
  const queryClient = useQueryClient();

  const { mutate: toggleFav, isPending: isTogglingFavourite } = useMutation({
    mutationFn: (restaurantId) => toggleFavourite(restaurantId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      if (data?.data?.isFavourited) {
        toast.success("Added to favourites");
      } else {
        toast.success("Removed from favourites");
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update favourites"
      );
    },
  });

  return { toggleFav, isTogglingFavourite };
}
