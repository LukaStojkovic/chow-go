import { useEffect, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SEARCH_LIMITS, normalizeSearchTerm } from "@chowgo/shared/search";
import { toSearchParams } from "@chowgo/shared/searchFilters";
import {
  getDiscoverFeed,
  getPopularItems,
  getPromotions,
  getTrendingSearches,
  searchDiscover,
  suggestSearch,
} from "@/services/apiDiscover";
import { getNearbyRestaurants } from "@/services/apiLocation";
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

export function useDiscoverSearch(query, filters) {
  const { coordinates, enabled } = useCoordinates();
  const q = normalizeSearchTerm(query);
  const params = toSearchParams(filters);

  return useInfiniteQuery({
    queryKey: ["discoverSearch", coordinates?.lat, coordinates?.lon, q, params],
    enabled: enabled && q.length > 0,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => searchDiscover({ ...coordinates, q, filters, page: pageParam }),
    getNextPageParam: (last) =>
      last.pagination?.hasNext ? last.pagination.page + 1 : undefined,
    staleTime: 30_000,
  });
}

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useSearchSuggestions(text) {
  const { coordinates, enabled } = useCoordinates();
  const q = useDebouncedValue(normalizeSearchTerm(text), 180);

  return useQuery({
    queryKey: ["discoverSuggest", coordinates?.lat, coordinates?.lon, q],
    enabled: enabled && q.length >= SEARCH_LIMITS.minLength,
    queryFn: () => suggestSearch({ ...coordinates, q }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useTrendingSearches() {
  const { coordinates, enabled } = useCoordinates();

  return useQuery({
    queryKey: ["discoverTrending", coordinates?.lat, coordinates?.lon],
    enabled,
    queryFn: () => getTrendingSearches(coordinates),
    staleTime: 5 * 60_000,
  });
}

export function useNearbyRestaurants() {
  const { coordinates, enabled } = useCoordinates();

  return useQuery({
    queryKey: ["nearbyRestaurants", coordinates?.lat, coordinates?.lon],
    enabled,
    queryFn: () => getNearbyRestaurants(coordinates),
  });
}
