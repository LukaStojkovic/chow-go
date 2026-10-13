/**
 * Search.
 *
 * Its own route rather than a dropdown under the header. A dropdown cannot
 * hold filters, cannot show enough results to compare, and traps a keyboard
 * user in a popup. This screen also gives search a shareable URL - `?q=` and
 * the filter params are the source of truth, so a result set can be linked and
 * Back returns to it. Filtering, sorting and paging run on the server.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { Clock, Flame, History, Search as SearchIcon, X } from "lucide-react";

import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useSearchResults, useTrendingSearches } from "@/hooks/Search/useSearch";

import { PageContainer, ResponsiveGrid, Section, Stack } from "@/components/layout/primitives";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/discovery/RestaurantCard";
import { DishCard, DishCardSkeleton } from "@/components/discovery/DishCard";
import { ItemCustomizationSheet } from "@/components/basket/ItemCustomizationSheet";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/features/search/SearchFilters";
import { SearchTypeahead } from "@/features/search/SearchTypeahead";
import { cuisineLabel } from "@chowgo/shared/constants";
import { SEARCH_LIMITS } from "@chowgo/shared/search";
import {
  DEFAULT_SEARCH_FILTERS,
  countActiveFilters,
  parseSearchFilters,
  toSearchParams,
} from "@chowgo/shared/searchFilters";

function Chip({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border bg-card text-foreground hover:border-border-strong hover:bg-muted h-9 shrink-0 rounded-full border px-3 text-label outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}

export default function SearchPage() {
  const { t } = useTranslation(["discover", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { address, coordinates } = useDeliveryStore();
  const { isFavourite, toggleFavourite, isPending } = useFavourites();
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useRecentSearches();

  const urlQuery = searchParams.get("q") ?? "";
  const filters = useMemo(
    () => parseSearchFilters(Object.fromEntries(searchParams)),
    [searchParams],
  );
  const [query, setQuery] = useState(urlQuery);
  const [selectedDish, setSelectedDish] = useState(null);
  const inputRef = useRef(null);

  const hasLocation = Boolean(coordinates?.lat && coordinates?.lon);

  const writeQuery = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("q", value);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  };

  const setFilters = (nextFilters) => {
    setSearchParams(
      (prev) => {
        const q = prev.get("q");
        return { ...(q ? { q } : {}), ...toSearchParams(nextFilters) };
      },
      { replace: true },
    );
  };

  /** Push the query into the URL, replacing so each keystroke is not a history entry. */
  const commitQuery = useDebouncedCallback((value) => {
    const term = value.trim();
    if (term === (searchParams.get("q") ?? "")) return;
    writeQuery(term);
    if (term.length >= SEARCH_LIMITS.minLength) addRecentSearch(term);
  }, 450);

  useEffect(() => {
    commitQuery(query);
  }, [query, commitQuery]);

  const coords = hasLocation ? { lat: coordinates.lat, lon: coordinates.lon } : null;
  const results = useSearchResults({ coords, q: urlQuery, filters });
  const trending = useTrendingSearches(coords);
  const { restaurants, dishes, total } = results;

  const activeFilterCount = countActiveFilters(filters);
  const hasQuery = results.enabled;
  const isSearching = results.isFetching && !results.isFetchingNextPage;
  const hasResults = restaurants.length > 0 || dishes.length > 0;
  const filtersHidEverything = hasQuery && !hasResults && activeFilterCount > 0;

  if (!hasLocation) return <Navigate to="/" replace />;

  const runSearch = (term) => {
    const value = term.trim();
    if (!value) return;
    commitQuery.cancel();
    setQuery(value);
    writeQuery(value);
    if (value.length >= SEARCH_LIMITS.minLength) addRecentSearch(value);
  };

  const trendingLabel = (entry) => {
    if (entry.kind === "cuisine") return cuisineLabel(t, entry.value);
    if (entry.kind === "category") {
      return t(`common:taxonomy.category.${entry.value}`, { defaultValue: entry.value });
    }
    return entry.value;
  };

  return (
    <>
      <PageContainer className="py-5 sm:py-6">
        <Stack gap="xl">
          <div className="space-y-1">
            <h1 className="text-h1">{t("search.heading")}</h1>
            <p className="text-body-sm text-muted-foreground">
              {t("pageHeading", { address })}
            </p>
          </div>

          <SearchTypeahead
            ref={inputRef}
            value={query}
            onChange={setQuery}
            onSubmit={runSearch}
            coords={coords}
            isSearching={isSearching}
            autoFocus
            placeholder={t("search.hintPlaceholder")}
          />

          {/* Announced so a screen-reader user knows the results changed
              without having to go looking for them. */}
          <p aria-live="polite" className="sr-only">
            {isSearching
              ? t("common:state.searching")
              : hasQuery
                ? t("search.announce", {
                    restaurants: t("search.countRestaurants", { count: total }),
                    dishes: t("search.countDishes", { count: dishes.length }),
                  })
                : ""}
          </p>

          {!hasQuery ? (
            <Stack gap="xl">
              {recentSearches.length > 0 && (
                <Section
                  title={t("search.recent")}
                  action={
                    <Button variant="link" size="sm" onClick={clearRecentSearches}>
                      {t("common:actions.clearAll")}
                    </Button>
                  }
                >
                  <ul className="divide-border border-border divide-y rounded-md border">
                    {recentSearches.map((term) => (
                      <li key={term} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => runSearch(term)}
                          className="text-body hover:bg-muted flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left outline-none focus-visible:bg-muted"
                        >
                          <History
                            className="text-muted-foreground size-4 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{term}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecentSearch(term)}
                          aria-label={t("search.removeRecent", { term })}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted mr-2 flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {trending.trending.length > 0 && (
                <Section title={t("search.trending")}>
                  <ul className="flex flex-wrap gap-2">
                    {trending.trending.map((entry) => (
                      <li key={`${entry.kind}-${entry.value}`}>
                        <Chip onClick={() => runSearch(trendingLabel(entry))}>
                          <span className="flex items-center gap-1.5">
                            <Flame className="text-primary size-3.5" aria-hidden="true" />
                            {trendingLabel(entry)}
                          </span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {trending.cuisines.length > 0 && (
                <Section title={t("search.popularCuisines")}>
                  <ul className="flex flex-wrap gap-2">
                    {trending.cuisines.map((slug) => (
                      <li key={slug}>
                        <Chip onClick={() => runSearch(cuisineLabel(t, slug))}>
                          {cuisineLabel(t, slug)}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {recentSearches.length === 0 &&
                trending.trending.length === 0 &&
                trending.cuisines.length === 0 && (
                  <EmptyState
                    icon={SearchIcon}
                    title={t("search.prompt.title")}
                    description={t("search.prompt.description")}
                  />
                )}
            </Stack>
          ) : (
            <>
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                activeCount={activeFilterCount}
                onReset={() => setFilters(DEFAULT_SEARCH_FILTERS)}
              />

              {results.isError && !hasResults ? (
                <ErrorState
                  title={t("search.error.title")}
                  description={t("search.error.description")}
                  onRetry={() => results.refetch()}
                />
              ) : results.isPending ? (
                <Stack gap="xl">
                  <Section title={t("search.restaurantsHeading")}>
                    <ResponsiveGrid aria-busy="true">
                      {[0, 1, 2, 3].map((i) => (
                        <RestaurantCardSkeleton key={i} />
                      ))}
                    </ResponsiveGrid>
                  </Section>
                  <Section title={t("search.dishesHeading")}>
                    <ResponsiveGrid aria-busy="true">
                      {[0, 1, 2, 3].map((i) => (
                        <DishCardSkeleton key={i} />
                      ))}
                    </ResponsiveGrid>
                  </Section>
                </Stack>
              ) : !hasResults ? (
                <EmptyState
                  icon={filtersHidEverything ? Clock : SearchIcon}
                  title={
                    filtersHidEverything
                      ? t("search.noFilterMatches.title")
                      : t("search.noResults.title", { query: urlQuery })
                  }
                  description={
                    filtersHidEverything
                      ? t("search.noFilterMatches.description")
                      : t("search.noResults.description")
                  }
                  action={
                    filtersHidEverything ? (
                      <Button variant="outline" onClick={() => setFilters(DEFAULT_SEARCH_FILTERS)}>
                        {t("filters.clearAll")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          commitQuery.cancel();
                          setQuery("");
                          writeQuery("");
                          inputRef.current?.focus();
                        }}
                      >
                        {t("search.startOver")}
                      </Button>
                    )
                  }
                />
              ) : (
                <Stack gap="xl">
                  {restaurants.length > 0 && (
                    <Section
                      title={t("search.restaurantsHeading")}
                      description={t("search.matches", { count: total || restaurants.length })}
                    >
                      <ResponsiveGrid>
                        {restaurants.map((restaurant) => (
                          <RestaurantCard
                            key={restaurant.id}
                            restaurant={restaurant}
                            isFavourite={isFavourite(restaurant.id)}
                            onToggleFavourite={toggleFavourite}
                            isTogglingFavourite={isPending}
                            animate={false}
                          />
                        ))}
                      </ResponsiveGrid>
                      {results.hasNextPage && (
                        <div className="mt-4 flex justify-center">
                          <Button
                            variant="outline"
                            onClick={() => results.fetchNextPage()}
                            disabled={results.isFetchingNextPage}
                            aria-busy={results.isFetchingNextPage}
                          >
                            {t("search.showMoreRestaurants")}
                          </Button>
                        </div>
                      )}
                    </Section>
                  )}

                  {dishes.length > 0 && (
                    <Section
                      title={t("search.dishesHeading")}
                      description={t("search.matches", { count: dishes.length })}
                    >
                      <ResponsiveGrid>
                        {dishes.map((dish) => (
                          <DishCard
                            key={dish.id}
                            dish={dish}
                            onAdd={setSelectedDish}
                            animate={false}
                          />
                        ))}
                      </ResponsiveGrid>
                    </Section>
                  )}
                </Stack>
              )}
            </>
          )}
        </Stack>
      </PageContainer>

      <ItemCustomizationSheet dish={selectedDish} onClose={() => setSelectedDish(null)} />
    </>
  );
}
