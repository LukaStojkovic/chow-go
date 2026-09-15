import { markInTransit } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

export default function useMarkAsInTransitOrder() {
  const queryClient = useQueryClient();

  const { mutate: markInTransitOrder, isPending: isMarkingInTransit } =
    useMutation({
      mutationFn: markInTransit,
      onSuccess: (_, orderId) => {
        toast.success(t("courier:delivery.markedInTransit"));
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
          err?.response?.data?.message ?? t("courier:delivery.markInTransitFailed"),
        );
      },
    });

  return { markInTransitOrder, isMarkingInTransit };
}
