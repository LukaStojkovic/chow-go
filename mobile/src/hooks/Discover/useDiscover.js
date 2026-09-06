import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getDiscoverFeed,
  getPopularItems,
  getPromotions,
  searchDiscover,
} from "@/services/apiDiscover";
import { useDeliveryStore } from "@/store/useDeliveryStore";

// Every discovery read is geo-scoped, so each hook is disabled until there are
// coordinates rather than firing a request the backend would reject.
function useCoordinates() {
  const coordinates = useDeliveryStore((state) => state.coordinates);
  return { coordinates, enabled: Boolean(coordinates?.lat && coordinates?.lon) };
}

export function useDiscoverFeed(category) {
  const { coordinates, enabled } = useCoordinates();

  return useInfiniteQuery({
    queryKey: ["discoverFeed", coordinates?.lat, coordinates?.lon, category],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getDiscoverFeed({ ...coordinates, category, page: pageParam }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function usePopularItems() {
  const { coordinates, enabled } = useCoordinates();

  return useQuery({
    queryKey: ["discoverPopular", coordinates?.lat, coordinates?.lon],
    enabled,
    queryFn: () => getPopularItems(coordinates),
  });
}

export function usePromotions() {
  const { coordinates, enabled } = useCoordinates();

  return useQuery({
    queryKey: ["discoverPromotions", coordinates?.lat, coordinates?.lon],
    enabled,
    queryFn: () => getPromotions(coordinates),
  });
}

export function useDiscoverSearch(query) {
  const { coordinates, enabled } = useCoordinates();
  const trimmed = query?.trim() ?? "";

  return useQuery({
    queryKey: ["discoverSearch", coordinates?.lat, coordinates?.lon, trimmed],
    enabled: enabled && trimmed.length > 0,
    queryFn: () => searchDiscover({ ...coordinates, query: trimmed }),
    // Search is the tightest-limited endpoint on the backend; a short cache
    // stops back-navigation re-spending the budget.
    staleTime: 30_000,
  });
}
