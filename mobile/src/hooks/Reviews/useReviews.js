import { keepPreviousData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteReviewReply,
  getRestaurantReviews,
  getSellerReviews,
  saveReviewReply,
} from "@/services/apiReview";

const PAGE_SIZE = 10;

function compactFilters(filters = {}) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null));
}

const pageOptions = {
  initialPageParam: 1,
  placeholderData: keepPreviousData,
  getNextPageParam: (last) => (last?.pagination?.hasNext ? last.pagination.page + 1 : undefined),
};

export function useRestaurantReviews(restaurantId, filters) {
  const params = compactFilters(filters);
  return useInfiniteQuery({
    queryKey: ["restaurantReviews", restaurantId, params],
    queryFn: ({ pageParam }) => getRestaurantReviews(restaurantId, { ...params, page: pageParam, limit: PAGE_SIZE }),
    enabled: Boolean(restaurantId),
    ...pageOptions,
  });
}

export function useSellerReviews(filters) {
  const params = compactFilters(filters);
  return useInfiniteQuery({
    queryKey: ["sellerReviews", params],
    queryFn: ({ pageParam }) => getSellerReviews({ ...params, page: pageParam, limit: PAGE_SIZE }),
    ...pageOptions,
  });
}

export function flattenReviews(data) {
  return data?.pages?.flatMap((page) => page?.reviews ?? []) ?? [];
}

export function summaryOf(data) {
  return data?.pages?.[0]?.summary ?? null;
}

function useReplyMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerReviews"] });
      queryClient.invalidateQueries({ queryKey: ["restaurantReviews"] });
    },
  });
}

export const useSaveReviewReply = () => useReplyMutation(saveReviewReply);
export const useDeleteReviewReply = () => useReplyMutation(deleteReviewReply);
