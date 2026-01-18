import { getUserDeliveryAddresses } from "@/services/apiAddress";
import { useQuery } from "@tanstack/react-query";

export default function useGetDeliveryAddresses() {
  const { data: deliveryAddresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["deliveryAddresses"],
    queryFn: getUserDeliveryAddresses,
  });

  return { deliveryAddresses, isLoadingAddresses };
}
