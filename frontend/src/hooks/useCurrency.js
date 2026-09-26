import { normalizeCurrency } from "@chowgo/shared/currency";
import { useAuthStore } from "@/store/useAuthStore";

// A seller's own restaurant's currency; everyone else gets the platform's,
// which is what courier earnings are summed in. Anything showing one order
// should read that order's `currency` instead.
export function useCurrency() {
  const restaurant = useAuthStore((state) => state.authUser?.restaurant?.[0]);
  return normalizeCurrency(restaurant?.currency);
}
