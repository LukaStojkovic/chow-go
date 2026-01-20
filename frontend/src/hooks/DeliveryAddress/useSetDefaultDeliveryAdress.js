import { setDefaultDeliveryAddress } from "@/services/apiAddress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function useSetDefaultDeliveryAdress() {
  const queryClient = useQueryClient();

  const { mutate: setDefaultAddress, isPending: isSettingDefaultAddress } =
    useMutation({
      mutationFn: ({ addressId }) => setDefaultDeliveryAddress(addressId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message || "Failed to set default address",
        );
      },
    });

  return { setDefaultAddress, isSettingDefaultAddress };
}
