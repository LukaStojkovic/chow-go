import { createMenuItem as createMenuItemApi } from "@/services/apiRestaurant";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "@chowgo/shared/i18n";

import { toast } from "sonner";

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  const { mutate: createMenuItem, isPending: isCreating } = useMutation({
    mutationFn: ({ restaurantId, menuItemData }) =>
      createMenuItemApi(restaurantId, menuItemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success(t("seller:menu.createdShort"));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t("seller:menu.createFailed")
      );
    },
  });

  return { createMenuItem, isCreating };
}
