import { getUserDeliveryAddresses } from "@/services/apiAddress";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";

export default function useGetDeliveryAddresses() {
  const { authUser } = useAuthStore();

  const { data: deliveryAddresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["deliveryAddresses"],
    queryFn: getUserDeliveryAddresses,
    enabled: !!authUser,
  });

  return { deliveryAddresses, isLoadingAddresses };
}
