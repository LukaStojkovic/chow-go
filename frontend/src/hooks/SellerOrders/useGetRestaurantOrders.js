import { getRestaurantOrders } from "@/services/apiRestaurantOrder";
import { useQuery } from "@tanstack/react-query";

export function useGetRestaurantOrders(params = {}) {
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error,
    refetch,
  } = useQuery({
    queryKey: ["restaurantOrders", params],
    queryFn: () => getRestaurantOrders(params),
    refetchInterval: 10000,
  });

  return {
    orders: ordersData?.data?.orders || [],
    counts: ordersData?.data?.counts || {},
    pagination: ordersData?.data?.pagination || {},
    isLoadingOrders,
    error,
    refetch,
  };
}
