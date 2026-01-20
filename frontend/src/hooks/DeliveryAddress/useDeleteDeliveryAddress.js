import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteDeliveryAddress } from "../../services/apiAddress";
import { useState } from "react";

export default function useDeleteDeliveryAddress() {
  const queryClient = useQueryClient();
  const [loadingAddressId, setLoadingAddressId] = useState(null);

  const { mutate: deleteAddress } = useMutation({
    mutationFn: ({ addressId }) => {
      setLoadingAddressId(addressId);
      return deleteDeliveryAddress(addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      toast.success("Address deleted successfully");
      setLoadingAddressId(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete address");
      setLoadingAddressId(null);
    },
  });

  return { deleteAddress, loadingAddressId };
}
