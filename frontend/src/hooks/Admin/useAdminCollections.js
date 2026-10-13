import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";

import { getAdminCollections, previewAdminCollection, searchCollectionPins } from "@/services/apiAdmin";

const EMPTY = [];

export function useAdminCollections({ archived = false } = {}) {
  const query = useQuery({
    queryKey: ["admin", "collections", archived ? "archived" : "active"],
    queryFn: () => getAdminCollections(archived ? { status: "archived" } : undefined),
  });
  return { ...query, collections: query.data?.collections ?? EMPTY };
}

export function useCollectionPinSearch(kind, q) {
  const term = q.trim();
  const query = useQuery({
    queryKey: ["admin", "collectionPins", kind, term],
    queryFn: () => searchCollectionPins({ kind, q: term }),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  return { ...query, results: term.length >= 2 ? query.data?.results ?? EMPTY : EMPTY };
}

export function useCollectionPinNames(kind, ids) {
  const query = useQuery({
    queryKey: ["admin", "collectionPinNames", kind, ids],
    queryFn: () => searchCollectionPins({ kind, ids }),
    enabled: ids.length > 0,
    staleTime: Infinity,
  });
  return query.data?.results ?? EMPTY;
}

export function useCollectionPreview() {
  return useMutation({ mutationFn: previewAdminCollection });
}
