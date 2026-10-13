import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";
import {
  deleteReviewReply,
  getRestaurantReviews,
  getSellerReviews,
  saveReviewReply,
} from "@/services/apiReview";

const PAGE_SIZE = 10;

export function toReviewQueryParams(filter) {
  if (filter === "withText") return { withText: true };
  if (filter === "unanswered") return { unreplied: true };
  if (/^[1-5]$/.test(String(filter))) return { rating: Number(filter) };
  return {};
}

function useReviewPages(queryKey, fetchPage, enabled = true) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last?.pagination?.hasNext ? last.pagination.page + 1 : undefined,
    enabled,
  });

  const pages = query.data?.pages ?? [];
  return {
    ...query,
    reviews: pages.flatMap((page) => page.reviews ?? []),
    summary: pages[0]?.summary ?? null,
  };
}

export function useRestaurantReviews(restaurantId, filter = "all", { enabled = true } = {}) {
  return useReviewPages(
    ["restaurantReviews", restaurantId, filter],
    (page) =>
      getRestaurantReviews(restaurantId, { page, limit: PAGE_SIZE, ...toReviewQueryParams(filter) }),
    enabled && Boolean(restaurantId),
  );
}

export function useSellerReviews(filter = "all") {
  return useReviewPages(["sellerReviews", filter], (page) =>
    getSellerReviews({ page, limit: PAGE_SIZE, ...toReviewQueryParams(filter) }),
  );
}

function useReplyMutation(mutationFn, successKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey));
      queryClient.invalidateQueries({ queryKey: ["sellerReviews"] });
      queryClient.invalidateQueries({ queryKey: ["restaurantReviews"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t("restaurant:reviews.replyFailed"));
    },
  });
}

export const useSaveReviewReply = () =>
  useReplyMutation(saveReviewReply, "restaurant:reviews.replySaved");
export const useDeleteReviewReply = () =>
  useReplyMutation(deleteReviewReply, "restaurant:reviews.replyDeleted");
