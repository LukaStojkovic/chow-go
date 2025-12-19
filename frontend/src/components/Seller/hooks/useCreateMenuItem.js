import { createMenuItem as createMenuItemApi } from "@/services/apiRestaurant";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  const { mutate: createMenuItem, isPending: isCreating } = useMutation({
    mutationFn: ({ restaurantId, menuItemData }) =>
      createMenuItemApi(restaurantId, menuItemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success("New menu item created successfully");
    },
    onError: (error) => {
      console.log("error iz query-a", error);
      toast.error(
        error?.response?.data?.message || "Failed to create menu item"
      );
    },
  });

  return { createMenuItem, isCreating };
}
