/**
 * Search.
 *
 * Its own route rather than a dropdown under the header. A dropdown cannot
 * hold filters, cannot show enough results to compare, and traps a keyboard
 * user in a popup. This screen also gives search a shareable URL - `?q=` is
 * the source of truth, so a result set can be linked and the browser Back
 * button steps through queries.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { Clock, History, Search as SearchIcon, X } from "lucide-react";

import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useDiscoverStore } from "@/store/useDiscoverStore";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { useRecentSearches } from "@/hooks/useRecentSearches";

import { PageContainer, ResponsiveGrid, Section, Stack } from "@/components/layout/primitives";
import { SearchBar } from "@/components/discovery/SearchBar";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/discovery/RestaurantCard";
import { DishCard, DishCardSkeleton } from "@/components/discovery/DishCard";
import { ItemCustomizationSheet } from "@/components/basket/ItemCustomizationSheet";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { Button } from "@/components/ui/button";
import { SearchFilters } from "@/features/search/SearchFilters";
import {
  DEFAULT_SEARCH_FILTERS,
  applyRestaurantFilters,
  countActiveFilters,
} from "@chowgo/shared/searchFilters";

const MIN_QUERY_LENGTH = 2;

export default function SearchPage() {
  const { t } = useTranslation(["discover", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { address, coordinates } = useDeliveryStore();
  const { searchRestaurants, searchDishes, isSearching, searchError, search, clearSearch } =
    useDiscoverStore();
  const { isFavourite, toggleFavourite, isPending } = useFavourites();
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useRecentSearches();

  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [filters, setFilters] = useState(DEFAULT_SEARCH_FILTERS);
  const [selectedDish, setSelectedDish] = useState(null);
  const inputRef = useRef(null);

  const hasLocation = Boolean(coordinates?.lat && coordinates?.lon);

  /** Push the query into the URL, replacing so each keystroke is not a history entry. */
  const commitQuery = useDebouncedCallback((value) => {
    setSearchParams(value ? { q: value } : {}, { replace: true });
    if (value.length >= MIN_QUERY_LENGTH) addRecentSearch(value);
  }, 450);

  useEffect(() => {
    commitQuery(query);
  }, [query, commitQuery]);

  useEffect(() => {
    if (!hasLocation) return;

    if (urlQuery.length >= MIN_QUERY_LENGTH) {
      search(coordinates.lat, coordinates.lon, urlQuery);
    } else {
      clearSearch();
    }
  }, [urlQuery, hasLocation, coordinates?.lat, coordinates?.lon, search, clearSearch]);

  const restaurants = useMemo(
    () => applyRestaurantFilters(searchRestaurants, filters),
    [searchRestaurants, filters],
  );

  const activeFilterCount = countActiveFilters(filters);
  const hasQuery = urlQuery.length >= MIN_QUERY_LENGTH;
  const hasResults = restaurants.length > 0 || searchDishes.length > 0;
  const filtersHidEverything =
    hasQuery && !hasResults && searchRestaurants.length > 0 && activeFilterCount > 0;

  if (!hasLocation) return <Navigate to="/" replace />;

  const runSearch = (term) => {
    setQuery(term);
    commitQuery.flush?.();
    setSearchParams({ q: term }, { replace: true });
    addRecentSearch(term);
    inputRef.current?.focus();
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

          <SearchBar
            ref={inputRef}
            value={query}
            onChange={setQuery}
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
                    restaurants: t("search.countRestaurants", { count: restaurants.length }),
                    dishes: t("search.countDishes", { count: searchDishes.length }),
                  })
                : ""}
          </p>

          {!hasQuery ? (
            recentSearches.length > 0 ? (
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
            ) : (
              <EmptyState
                icon={SearchIcon}
                title={t("search.prompt.title")}
                description={t("search.prompt.description")}
              />
            )
          ) : (
            <>
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                activeCount={activeFilterCount}
                onReset={() => setFilters(DEFAULT_SEARCH_FILTERS)}
              />

              {searchError ? (
                <ErrorState
                  title={t("search.error.title")}
                  description={t("search.error.description")}
                  onRetry={() => search(coordinates.lat, coordinates.lon, urlQuery)}
                />
              ) : isSearching && !hasResults ? (
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
                      <Button variant="outline" onClick={() => setQuery("")}>
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
                      description={t("search.matches", { count: restaurants.length })}
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
                    </Section>
                  )}

                  {searchDishes.length > 0 && (
                    <Section
                      title={t("search.dishesHeading")}
                      description={t("search.matches", { count: searchDishes.length })}
                    >
                      <ResponsiveGrid>
                        {searchDishes.map((dish) => (
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
