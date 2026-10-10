import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toUpsellViews } from "@chowgo/shared/adapters/menu";
import { getCartSuggestions } from "@/services/apiCart";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

const lineIdOf = (item) => String(item.lineId || (item.menuItem?._id ?? item.menuItem));

export function useCartSuggestions() {
  const authUser = useAuthStore((state) => state.authUser);
  const lineIds = useCartStore((state) => state.items.map(lineIdOf).sort().join(","));

  return useQuery({
    queryKey: ["cartSuggestions", lineIds],
    queryFn: getCartSuggestions,
    select: toUpsellViews,
    enabled: Boolean(authUser) && lineIds.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
