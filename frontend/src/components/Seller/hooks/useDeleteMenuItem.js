import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMenuItem as deleteMenuItemApi } from "@/services/apiRestaurant";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  const { mutate: deleteMenuItem, isPending: isDeleting } = useMutation({
    mutationFn: ({ restaurantId, menuItemId }) =>
      deleteMenuItemApi(restaurantId, menuItemId),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menuItems"] });
      toast.success(data?.message || t("seller:menu.deletedShort"));
    },
  });

  return { deleteMenuItem, isDeleting };
}
