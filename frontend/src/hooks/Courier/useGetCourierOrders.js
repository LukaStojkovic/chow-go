import { getCourierOrders } from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";

export default function useGetCourierOrders() {
  const { authUser } = useAuthStore();

  const { data: courierOrders, isLoading: isLoadingCourierOrders } = useQuery({
    queryKey: ["courierOrders"],
    queryFn: getCourierOrders,
    enabled: !!authUser,
  });

  return { courierOrders, isLoadingCourierOrders };
}
