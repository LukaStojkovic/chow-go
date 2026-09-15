import { markAsPickedUp } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useMarkAsPickedUpOrder() {
  const queryClient = useQueryClient();

  const { mutate: markPickedUpOrder, isPending: isMarkingPickedUp } =
    useMutation({
      mutationFn: markAsPickedUp,
      onSuccess: (_, orderId) => {
        toast.success(t("courier:delivery.markedPickedUp"));
        queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
        queryClient.invalidateQueries({
          queryKey: ["courierOrders", "active"],
        });
        queryClient.invalidateQueries({
          queryKey: ["courierOrders", "history"],
        });
        queryClient.invalidateQueries({ queryKey: ["courierOrder", orderId] });
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ?? t("courier:delivery.markPickedUpFailed"),
        );
      },
    });

  return { markPickedUpOrder, isMarkingPickedUp };
}
