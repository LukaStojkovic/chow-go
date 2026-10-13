import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { apiErrorMessage } from "@/lib/apiError";
import {
  downloadOrdersCsv,
  downloadPayoutCsv,
  getClosures,
  getPayouts,
  saveClosures,
} from "@/services/apiSellerReports";

const csvHandlers = {
  onSuccess: () => toast.success(t("seller:reports.export.started")),
  onError: (err) => toast.error(apiErrorMessage(err)),
};

export function useExportOrdersCsv() {
  return useMutation({ mutationFn: downloadOrdersCsv, ...csvHandlers });
}

export function useDownloadPayoutCsv() {
  return useMutation({ mutationFn: downloadPayoutCsv, ...csvHandlers });
}

export function useSellerPayouts() {
  return useInfiniteQuery({
    queryKey: ["sellerPayouts"],
    queryFn: ({ pageParam }) => getPayouts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.pagination?.hasNext ? last.pagination.page + 1 : undefined),
  });
}

export function useSellerClosures() {
  return useQuery({ queryKey: ["sellerClosures"], queryFn: getClosures });
}

export function useSaveClosures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveClosures,
    onSuccess: (data) => {
      queryClient.setQueryData(["sellerClosures"], data);
      toast.success(t("seller:closures.saved"));
    },
  });
}
