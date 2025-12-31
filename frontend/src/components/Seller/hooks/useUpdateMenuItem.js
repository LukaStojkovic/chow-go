import { updateMenuItem as updateMenuItemApi } from "@/services/apiRestaurant";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  const { mutate: updateMenuItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ restaurantId, menuItemId, menuItemData }) =>
      updateMenuItemApi(restaurantId, menuItemId, menuItemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("Menu item updated successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update menu item"
      );
    },
  });

  return { updateMenuItem, isUpdating };
}
