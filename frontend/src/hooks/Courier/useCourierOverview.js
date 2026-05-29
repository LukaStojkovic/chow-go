import { getCourierOverview } from "@/services/apiCourier";
import { useQuery } from "@tanstack/react-query";

export function useCourierOverview() {
  return useQuery({
    queryKey: ["courier-overview"],
    queryFn: getCourierOverview,
  });
}
