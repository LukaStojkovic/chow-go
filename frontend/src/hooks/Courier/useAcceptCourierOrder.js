import { acceptOrder } from "@/services/apiCourier";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useAcceptCourierOrder() {
  const queryClient = useQueryClient();

  const { mutate: acceptCourierOrder, isPending: isAccepting } = useMutation({
    mutationFn: acceptOrder,
    onSuccess: () => {
      toast.success("Order accepted! Head to the restaurant.");
      queryClient.invalidateQueries({ queryKey: ["courierAvailableOrders"] });
      queryClient.invalidateQueries({ queryKey: ["courierOrders"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Failed to accept order");
    },
  });

  return { acceptCourierOrder, isAccepting };
}
