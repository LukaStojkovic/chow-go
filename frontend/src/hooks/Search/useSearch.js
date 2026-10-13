import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { SEARCH_LIMITS, normalizeSearchTerm } from "@chowgo/shared/search";
import { toSearchParams } from "@chowgo/shared/searchFilters";

import { getSearchSuggestions, getTrendingSearches, searchDiscover } from "@/services/apiSearch";

const EMPTY = [];

const hasCoords = (coords) => Boolean(coords?.lat && coords?.lon);

export function useSearchResults({ coords, q, filters }) {
  const term = normalizeSearchTerm(q);
  const filterParams = toSearchParams(filters);
  const enabled = hasCoords(coords) && term.length >= SEARCH_LIMITS.minLength;

  const query = useInfiniteQuery({
    queryKey: ["search", coords?.lat, coords?.lon, term, filterParams],
    queryFn: ({ pageParam }) =>
      searchDiscover({
        lat: coords.lat,
        lon: coords.lon,
        q: term,
        ...filterParams,
        page: pageParam,
        limit: SEARCH_LIMITS.pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last?.pagination?.hasNext ? last.pagination.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled,
  });

  const pages = query.data?.pages;
  const restaurants = useMemo(
    () => (pages ? pages.flatMap((page) => toRestaurantViews(page.restaurants)) : EMPTY),
    [pages],
  );
  const dishes = useMemo(() => (pages ? toDishViews(pages[0]?.items) : EMPTY), [pages]);

  return {
    ...query,
    enabled,
    restaurants,
    dishes,
    total: pages?.[0]?.pagination?.total ?? 0,
  };
}

export function useSearchSuggestions({ coords, q }) {
  const term = normalizeSearchTerm(q);
  const enabled = hasCoords(coords) && term.length >= SEARCH_LIMITS.minLength;

  const query = useQuery({
    queryKey: ["searchSuggest", coords?.lat, coords?.lon, term],
    queryFn: () => getSearchSuggestions({ lat: coords.lat, lon: coords.lon, q: term }),
    select: (data) => data?.suggestions ?? EMPTY,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled,
    retry: false,
  });

  return { ...query, suggestions: enabled ? query.data ?? EMPTY : EMPTY };
}

export function useTrendingSearches(coords) {
  const query = useQuery({
    queryKey: ["searchTrending", coords?.lat, coords?.lon],
    queryFn: () => getTrendingSearches({ lat: coords.lat, lon: coords.lon }),
    staleTime: 5 * 60_000,
    enabled: hasCoords(coords),
    retry: false,
  });

  return {
    ...query,
    trending: query.data?.trending ?? EMPTY,
    cuisines: query.data?.cuisines ?? EMPTY,
  };
}
