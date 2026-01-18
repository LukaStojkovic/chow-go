import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addUserDeliveryAddress } from "../../services/apiAddress";

export default function useAddDeliveryAddress() {
  const queryClient = useQueryClient();

  const { mutate: addDeliveryAddress, isPending: isAddingDeliveryAddress } =
    useMutation({
      mutationFn: ({ data }) => addUserDeliveryAddress(data),
      onSuccess: (data) => {
        console.log(data);
        queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
        toast.success("New delivery address added");
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message || "Failed to add delivery address"
        );
      },
    });

  return { addDeliveryAddress, isAddingDeliveryAddress };
}
