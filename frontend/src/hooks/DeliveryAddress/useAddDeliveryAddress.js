import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addUserDeliveryAddress } from "../../services/apiAddress";
import { t } from "@chowgo/shared/i18n";

export default function useAddDeliveryAddress() {
  const queryClient = useQueryClient();

  const {
    mutateAsync: addDeliveryAddressAsync,
    isPending: isAddingDeliveryAddress,
  } = useMutation({
    mutationFn: async ({ data }) => {
      const response = await addUserDeliveryAddress(data);

      if (!response?.success) {
        const error = new Error(
          response?.message || t("profile:address.addFailed"),
        );
        error.response = { data: response };
        throw error;
      }

      return response;
    },
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["deliveryAddresses"] });
      toast.success(t("profile:address.added"));
    },
    onError: (error) => {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("profile:address.addFailed"),
      );
    },
  });

  return { addDeliveryAddressAsync, isAddingDeliveryAddress };
}
