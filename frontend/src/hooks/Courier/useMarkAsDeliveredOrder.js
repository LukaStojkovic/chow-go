import { markDelivered } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useMarkAsDeliveredOrder() {
  const queryClient = useQueryClient();

  const { mutate: markDeliveredOrder, isPending: isMarkingDelivered } =
    useMutation({
      mutationFn: markDelivered,
      onSuccess: (_, orderId) => {
        toast.success(t("courier:delivery.markedDelivered"));
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
          err?.response?.data?.message ?? t("courier:delivery.markDeliveredFailed"),
        );
      },
    });

  return { markDeliveredOrder, isMarkingDelivered };
}
