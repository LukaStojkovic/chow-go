import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";
import { getAdminList, getAdminOverview } from "@/services/apiAdmin";

export function useAdminOverview() {
  return useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
}

export function useAdminList(resource, params) {
  return useQuery({
    queryKey: ["admin", resource, params],
    queryFn: () => getAdminList(resource, params),
    placeholderData: keepPreviousData,
  });
}

// Any admin write can move a count on the overview and a row in the log, so
// everything under ["admin"] is refetched rather than guessing which.
export function useAdminAction(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t("admin:saved"));
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) => {
      toast.error(t("admin:failed"), { description: err?.response?.data?.message });
    },
  });
}
