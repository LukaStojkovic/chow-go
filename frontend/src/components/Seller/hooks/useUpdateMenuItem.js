import { updateMenuItem as updateMenuItemApi } from "@/services/apiRestaurant";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "@chowgo/shared/i18n";

import { toast } from "sonner";

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  const { mutate: updateMenuItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ restaurantId, menuItemId, menuItemData }) =>
      updateMenuItemApi(restaurantId, menuItemId, menuItemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success(t("seller:menu.updatedShort"));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t("seller:menu.updateFailed")
      );
    },
  });

  return { updateMenuItem, isUpdating };
}
