import { setDefaultDeliveryAddress } from "@/services/apiAddress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

export default function useSetDefaultDeliveryAddress() {
  const queryClient = useQueryClient();
  const [loadingAddressId, setLoadingAddressId] = useState(null);

  const { mutate: setDefaultAddress } = useMutation({
    mutationFn: ({ addressId }) => {
      setLoadingAddressId(addressId);
      return setDefaultDeliveryAddress(addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      setLoadingAddressId(null);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to set default address",
      );
      setLoadingAddressId(null);
    },
  });

  return { setDefaultAddress, loadingAddressId };
}
