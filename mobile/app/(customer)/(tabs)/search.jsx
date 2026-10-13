import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Keyboard, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Clock, Search as SearchIcon, X } from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { SEARCH_LIMITS, normalizeSearchTerm } from "@chowgo/shared/search";
import { DEFAULT_SEARCH_FILTERS } from "@chowgo/shared/searchFilters";
import { DishCard } from "@/components/discovery/DishCard";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button, IconButton } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { LocationGate } from "@/features/discover/LocationGate";
import { Rail } from "@/features/discover/Rail";
import { SearchFilterBar } from "@/features/search/SearchFilterBar";
import { SearchSuggestions } from "@/features/search/SearchSuggestions";
import { TrendingSearches } from "@/features/search/TrendingSearches";
import {
  useDiscoverSearch,
  useSearchSuggestions,
  useTrendingSearches,
} from "@/hooks/Discover/useDiscover";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useTokens } from "@/theme/useTokens";

export default function Search() {
  const { t } = useTranslation(["discover", "common"]);
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const { isFavourite, toggleFavourite } = useFavouriteToggle();
  const { recent, remember, clear } = useRecentSearches();
  const { color } = useTokens();
  const inputRef = useRef(null);

  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_SEARCH_FILTERS);

  const typed = normalizeSearchTerm(text);
  const showSuggestions = focused && typed.length >= SEARCH_LIMITS.minLength && typed !== term;

  const query = useDiscoverSearch(term, filters);
  const suggestions = useSearchSuggestions(showSuggestions ? typed : "");
  const trending = useTrendingSearches();

  const pages = query.data?.pages;
  const firstPage = pages?.[0];
  const total = firstPage?.pagination?.total ?? 0;

  const restaurants = useMemo(
    () => toRestaurantViews((pages ?? []).flatMap((page) => page.restaurants)),
    [pages],
  );
  const dishes = useMemo(() => toDishViews(firstPage?.items ?? []), [firstPage]);
  const closedRestaurants = useMemo(
    () =>
      new Set(
        (firstPage?.items ?? [])
          .filter((item) => item.restaurant?.isOpenNow === false)
          .map((item) => String(item.restaurant._id)),
      ),
    [firstPage],
  );

  useEffect(() => {
    if (term && firstPage && (firstPage.restaurants.length || firstPage.items.length)) remember(term);
  }, [term, firstPage, remember]);

  useEffect(() => {
    if (!typed) setTerm("");
  }, [typed]);

  if (!coordinates) return <LocationGate />;

  const commit = (value) => {
    const next = normalizeSearchTerm(value);
    setText(next);
    setTerm(next);
    Keyboard.dismiss();
    inputRef.current?.blur?.();
  };

  const openRestaurant = (id) => {
    Keyboard.dismiss();
    router.push(`/(customer)/restaurant/${id}`);
  };

  const searching = term.length > 0;
  const loading = query.isFetching && !query.isFetchingNextPage;
  const nothingFound = searching && !loading && !restaurants.length && !dishes.length;
  const filtered = filters.openNow || filters.maxDeliveryTime !== "any";

  return (
    <Screen edges={["top"]}>
      <View className="gap-3 pb-3 pt-2">
        <View className="gap-3 px-5">
          <SectionHeader
            title={t("discover:search.heading")}
            size="lg"
            subtitle={t("discover:feed.allSubtitle")}
          />
          <SearchInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => commit(text)}
            placeholder={t("discover:search.placeholder")}
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel={t("discover:search.label")}
            right={
              text ? (
                <IconButton
                  icon={X}
                  variant="muted"
                  size={30}
                  label={t("discover:search.clear")}
                  onPress={() => setText("")}
                />
              ) : null
            }
          />
        </View>
        {searching && !showSuggestions ? (
          <SearchFilterBar filters={filters} onChange={setFilters} />
        ) : null}
      </View>

      <View className="flex-1">
        <FlatList
          data={searching ? restaurants : []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-4 pb-44"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          ListHeaderComponent={
            searching && dishes.length ? (
              <Rail
                title={t("discover:search.dishesHeading")}
                subtitle={t("discover:summary.matchingDishes", { count: dishes.length })}
                data={dishes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <DishCard
                    dish={item}
                    closed={closedRestaurants.has(item.restaurantId)}
                    onPress={() => openRestaurant(item.restaurantId)}
                  />
                )}
              />
            ) : null
          }
          renderItem={({ item, index }) => (
            <View className="gap-3 px-5">
              {index === 0 ? (
                <SectionHeader
                  title={t("discover:search.restaurantsHeading")}
                  subtitle={t("discover:summary.placesMatch", { count: total || restaurants.length })}
                />
              ) : null}
              <RestaurantCard
                restaurant={item}
                isFavourite={isFavourite(item.id)}
                onToggleFavourite={() => toggleFavourite(item.id)}
                onPress={() => openRestaurant(item.id)}
              />
            </View>
          )}
          ListFooterComponent={
            searching && query.hasNextPage ? (
              <View className="items-center px-5 pt-2">
                {query.isFetchingNextPage ? (
                  <ActivityIndicator color={color.primary} />
                ) : (
                  <Button variant="secondary" onPress={() => query.fetchNextPage()}>
                    {t("discover:search.showMoreRestaurants")}
                  </Button>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            searching && loading ? (
              <View className="gap-4 px-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full rounded-lg" />
                ))}
              </View>
            ) : searching && query.isError ? (
              <EmptyState
                icon={SearchIcon}
                title={t("discover:search.error.title")}
                description={t("discover:search.error.description")}
                actionLabel={t("common:actions.retry")}
                onAction={() => query.refetch()}
              />
            ) : nothingFound ? (
              filtered ? (
                <EmptyState
                  icon={SearchIcon}
                  title={t("discover:search.noFilterMatches.title")}
                  description={t("discover:search.noFilterMatches.description")}
                  actionLabel={t("discover:filters.clearAll")}
                  onAction={() => setFilters(DEFAULT_SEARCH_FILTERS)}
                />
              ) : dishes.length ? null : (
                <EmptyState
                  icon={SearchIcon}
                  title={t("discover:search.noResults.title", { query: term })}
                  description={t("discover:search.noResults.description")}
                />
              )
            ) : !searching ? (
              <View className="gap-6">
                {recent.length ? (
                  <View className="gap-1 px-5">
                    <View className="flex-row items-center justify-between pb-1">
                      <Text variant="caption" tone="muted">
                        {t("discover:search.recent")}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("discover:search.clearRecent")}
                        hitSlop={8}
                        onPress={clear}
                        className="active:opacity-60"
                      >
                        <Text variant="label-sm" tone="primary">
                          {t("common:actions.clear")}
                        </Text>
                      </Pressable>
                    </View>
                    {recent.map((entry) => (
                      <Pressable
                        key={entry}
                        accessibilityRole="button"
                        onPress={() => commit(entry)}
                        className="flex-row items-center gap-3 rounded-md px-1 py-3 active:opacity-60"
                      >
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Clock size={16} color={color["muted-foreground"]} />
                        </View>
                        <Text variant="body-lg" className="flex-1" numberOfLines={1}>
                          {entry}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <TrendingSearches
                  trending={trending.data?.trending}
                  cuisines={trending.data?.cuisines}
                  onSearch={commit}
                />
                {!recent.length &&
                !trending.data?.trending?.length &&
                !trending.data?.cuisines?.length ? (
                  <EmptyState
                    icon={SearchIcon}
                    title={t("discover:search.prompt.title")}
                    description={t("discover:search.prompt.description")}
                  />
                ) : null}
              </View>
            ) : null
          }
        />

        {showSuggestions ? (
          <View className="absolute inset-0 bg-background">
            <SearchSuggestions
              query={typed}
              suggestions={suggestions.data ?? []}
              onSearch={commit}
              onOpenRestaurant={openRestaurant}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
