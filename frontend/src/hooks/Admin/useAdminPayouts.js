import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAdminPayouts } from "@/services/apiAdmin";

export function useAdminPayouts(params) {
  return useQuery({
    queryKey: ["admin", "payouts", params],
    queryFn: () => getAdminPayouts(params),
    placeholderData: keepPreviousData,
  });
}
