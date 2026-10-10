import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getCartSuggestions } from "@/services/apiCart";
import { useAuthStore } from "@/store/useAuthStore";

const EMPTY = [];

export function useCartSuggestions(lines) {
  const isCustomer = useAuthStore((state) => state.authUser?.role === "customer");
  const lineIds = (lines ?? []).map((line) => line.id).sort();
  const enabled = isCustomer && lineIds.length > 0;

  const query = useQuery({
    queryKey: ["cartSuggestions", lineIds],
    queryFn: getCartSuggestions,
    select: (res) => res?.data?.suggestions ?? EMPTY,
    placeholderData: keepPreviousData,
    enabled,
    retry: false,
  });

  return enabled && !query.isError ? query.data ?? EMPTY : EMPTY;
}
