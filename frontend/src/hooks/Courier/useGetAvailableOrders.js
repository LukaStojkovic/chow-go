import { getCourierAvailableOrders } from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";

export default function useGetAvailableOrders() {
  const { authUser } = useAuthStore();

  const { data: courierAvailableOrders, isLoading: isLoadingOrders } = useQuery(
    {
      queryKey: ["courierAvailableOrders"],
      queryFn: getCourierAvailableOrders,
      enabled: !!authUser,
    },
  );

  return { courierAvailableOrders, isLoadingOrders };
}
