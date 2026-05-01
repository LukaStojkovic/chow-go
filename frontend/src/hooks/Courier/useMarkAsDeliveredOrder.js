import { markDelivered } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useMarkAsDeliveredOrder() {
  const queryClient = useQueryClient();

  const { mutate: markDeliveredOrder, isPending: isMarkingDelivered } =
    useMutation({
      mutationFn: markDelivered,
      onSuccess: () => {
        toast.success("Order delivered! Great job.");
        queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
        queryClient.invalidateQueries({
          queryKey: ["courierOrders", "active"],
        });
        queryClient.invalidateQueries({
          queryKey: ["courierOrders", "history"],
        });
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ?? "Failed to mark as delivered",
        );
      },
    });

  return { markDeliveredOrder, isMarkingDelivered };
}
