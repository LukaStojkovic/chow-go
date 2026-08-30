import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateUserDeliveryAddress } from "../../services/apiAddress";

export default function useUpdateDeliveryAddress() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateDeliveryAddressAsync,
    isPending: isUpdatingDeliveryAddress,
  } = useMutation({
    mutationFn: async ({ addressId, data }) => {
      const response = await updateUserDeliveryAddress({ addressId, data });

      if (!response?.success) {
        const error = new Error(
          response?.message || "Failed to update delivery address",
        );
        error.response = { data: response };
        throw error;
      }

      return response;
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      toast.success("Delivery address updated");
    },
    onError: (error) => {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update delivery address",
      );
    },
  });

  return { updateDeliveryAddressAsync, isUpdatingDeliveryAddress };
}
