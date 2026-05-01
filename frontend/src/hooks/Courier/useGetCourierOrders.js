import { getCourierOrders } from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";

export default function useGetCourierOrders(status) {
  const { authUser } = useAuthStore();

  const { data: courierOrders, isLoading: isLoadingCourierOrders } = useQuery({
    queryKey: ["courierOrders", status],
    queryFn: () => getCourierOrders(status),
    enabled: !!authUser,
    staleTime: 0,
  });

  return { courierOrders, isLoadingCourierOrders };
}
