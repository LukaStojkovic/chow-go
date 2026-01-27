import { getOrderById } from "@/services/apiOrder";
import { useQuery } from "@tanstack/react-query";

export function useGetOrderById(orderId) {
  const {
    data: orderData,
    isLoading: isLoadingOrder,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  return {
    order: orderData?.data?.order || null,
    isLoadingOrder,
    error,
    refetch,
  };
}
