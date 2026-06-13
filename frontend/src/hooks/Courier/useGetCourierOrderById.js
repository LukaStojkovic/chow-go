import { getCourierOrderById } from "@/services/apiCourier";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";

export default function useGetCourierOrderById(orderId) {
  const { authUser } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["courierOrder", orderId],
    queryFn: () => getCourierOrderById(orderId),
    enabled: !!authUser && !!orderId,
    staleTime: 0,
  });

  return {
    order: data?.data?.order,
    isLoading,
    isError,
  };
}
