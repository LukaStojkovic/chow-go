import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteDeliveryAddress } from "../../services/apiAddress";
import { useState } from "react";
import { t } from "@chowgo/shared/i18n";

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
      toast.success(t("profile:address.deleted"));
      setLoadingAddressId(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("profile:address.deleteFailed"));
      setLoadingAddressId(null);
    },
  });

  return { deleteAddress, loadingAddressId };
}
