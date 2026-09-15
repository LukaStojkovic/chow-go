import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateUserDeliveryAddress } from "../../services/apiAddress";
import { t } from "@chowgo/shared/i18n";

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
          response?.message || t("profile:account.addressUpdateFailed"),
        );
        error.response = { data: response };
        throw error;
      }

      return response;
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      toast.success(t("profile:account.addressUpdated"));
    },
    onError: (error) => {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("profile:account.addressUpdateFailed"),
      );
    },
  });

  return { updateDeliveryAddressAsync, isUpdatingDeliveryAddress };
}
