import { getCustomerOrders } from "@/services/apiOrder";
import { useQuery } from "@tanstack/react-query";

export function useGetCustomerOrders(params = {}) {
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customerOrders", params],
    queryFn: () => getCustomerOrders(params),
  });

  return {
    orders: ordersData?.data?.orders || [],
    pagination: ordersData?.data?.pagination || {},
    isLoadingOrders,
    error,
    refetch,
  };
}
