import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";

import { getCollection, getHomeCollections } from "@/services/apiCollection";

const EMPTY = [];
const PAGE_SIZE = 24;

const hasCoords = (coords) => Boolean(coords?.lat && coords?.lon);

export const toCollectionItemViews = (kind, items) =>
  kind === "dishes" ? toDishViews(items) : toRestaurantViews(items);

export function useHomeCollections(coords) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const query = useQuery({
    queryKey: ["collections", "home", coords?.lat, coords?.lon, locale],
    queryFn: () => getHomeCollections({ lat: coords.lat, lon: coords.lon }),
    enabled: hasCoords(coords),
    staleTime: 60_000,
    retry: false,
  });

  const raw = query.data?.collections;
  const collections = useMemo(
    () =>
      raw
        ? raw.map((collection) => ({
            ...collection,
            views: toCollectionItemViews(collection.kind, collection.items),
          }))
        : EMPTY,
    [raw],
  );

  return { ...query, collections };
}

export function useCollectionPage(slug, coords) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const query = useInfiniteQuery({
    queryKey: ["collections", "page", slug, coords?.lat, coords?.lon, locale],
    queryFn: ({ pageParam }) =>
      getCollection(slug, { lat: coords.lat, lon: coords.lon, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.pagination?.hasNext ? last.pagination.page + 1 : undefined),
    enabled: Boolean(slug) && hasCoords(coords),
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  });

  const pages = query.data?.pages;
  const collection = pages?.[0]?.collection ?? null;
  const items = useMemo(
    () =>
      pages && collection
        ? pages.flatMap((page) => toCollectionItemViews(collection.kind, page.items))
        : EMPTY,
    [pages, collection],
  );

  return {
    ...query,
    collection,
    items,
    total: pages?.[0]?.pagination?.total ?? 0,
    isNotFound: query.error?.response?.status === 404,
  };
}
