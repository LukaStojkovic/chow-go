import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addUserDeliveryAddress } from "../../services/apiAddress";

export default function useAddDeliveryAddress() {
  const queryClient = useQueryClient();

  const { mutate: addDeliveryAddress, isPending: isAddingDeliveryAddress } =
    useMutation({
      mutationFn: async ({ data }) => {
        const response = await addUserDeliveryAddress(data);

        if (!response?.success) {
          const error = new Error(
            response?.message || "Failed to add delivery address",
          );
          error.response = { data: response };
          throw error;
        }

        return response;
      },
      onSuccess: (data) => {
        console.log(data);
        queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
        toast.success("New delivery address added");
      },
      onError: (error) => {
        console.log(error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to add delivery address",
        );
      },
    });

  return { addDeliveryAddress, isAddingDeliveryAddress };
}
