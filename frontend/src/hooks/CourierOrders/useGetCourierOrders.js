import { getCourierOrders } from "@/services/apiCourierOrder";
import { useQuery } from "@tanstack/react-query";

export function useGetCourierOrders({ status = "active", page = 1, limit = 20 } = {}) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["courierOrders", { status, page, limit }],
    queryFn: () => getCourierOrders({ status, page, limit }),
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

