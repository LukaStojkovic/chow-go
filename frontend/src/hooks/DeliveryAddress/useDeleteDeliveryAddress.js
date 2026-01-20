import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteDeliveryAddress } from "../../services/apiAddress";

export default function useDeleteDeliveryAddress() {
  const queryClient = useQueryClient();

  const { mutate: deleteAddress, isPending: isDeletingAddress } = useMutation({
    mutationFn: ({ addressId }) => deleteDeliveryAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      toast.success("Address deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete address");
    },
  });

  return { deleteAddress, isDeletingAddress };
}
