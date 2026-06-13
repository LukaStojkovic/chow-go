import { markAsPickedUp } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useMarkAsPickedUpOrder() {
  const queryClient = useQueryClient();

  const { mutate: markPickedUpOrder, isPending: isMarkingPickedUp } =
    useMutation({
      mutationFn: markAsPickedUp,
      onSuccess: (_, orderId) => {
        toast.success("Order marked as picked up!");
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
          err?.response?.data?.message ?? "Failed to mark order as picked up",
        );
      },
    });

  return { markPickedUpOrder, isMarkingPickedUp };
}
