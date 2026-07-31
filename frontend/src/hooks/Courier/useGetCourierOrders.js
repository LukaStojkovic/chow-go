import { getCourierOrders } from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export default function useGetCourierOrders(status, page = 1, limit = 10) {
  const { authUser } = useAuthStore();

  const {
    data: courierOrders,
    isLoading: isLoadingCourierOrders,
    isFetching: isFetchingCourierOrders,
  } = useQuery({
    queryKey: ["courierOrders", status, page, limit],
    queryFn: () => getCourierOrders(status, page, limit),
    enabled: !!authUser,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  return { courierOrders, isLoadingCourierOrders, isFetchingCourierOrders };
}
