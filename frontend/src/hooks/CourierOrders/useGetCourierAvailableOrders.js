import { getCourierAvailableOrders } from "@/services/apiCourierOrder";
import { useQuery } from "@tanstack/react-query";

export function useGetCourierAvailableOrders({ page = 1, limit = 20 } = {}) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["courierAvailableOrders", { page, limit }],
    queryFn: () => getCourierAvailableOrders({ page, limit }),
  });

  return {
    orders: data?.data?.orders || [],
    pagination: data?.data?.pagination || null,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

