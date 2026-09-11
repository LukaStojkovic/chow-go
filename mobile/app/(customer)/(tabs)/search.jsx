import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Clock, Search as SearchIcon, X } from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { DEFAULT_SEARCH_FILTERS, applyRestaurantFilters } from "@chowgo/shared/searchFilters";
import { DishCard } from "@/components/discovery/DishCard";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { IconButton } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { LocationGate } from "@/features/discover/LocationGate";
import { Rail } from "@/features/discover/Rail";
import { SearchFilterBar } from "@/features/search/SearchFilterBar";
import { useDiscoverSearch } from "@/hooks/Discover/useDiscover";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useTokens } from "@/theme/useTokens";

export default function Search() {
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const { isFavourite, toggleFavourite } = useFavouriteToggle();
  const { recent, remember, clear } = useRecentSearches();
  const { color } = useTokens();

  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState(DEFAULT_SEARCH_FILTERS);

  // Debounced: search is the tightest rate-limited endpoint on the backend, so
  // a request per keystroke would exhaust the budget within one word.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  // Only remembered once results actually come back, so half-typed words that
  // matched nothing never enter the history.
  const query = useDiscoverSearch(term);
  useEffect(() => {
    if (term && query.data) remember(term);
  }, [term, query.data, remember]);

  const restaurants = useMemo(
    // The endpoint caps at five restaurants server-side, so refining here beats
    // another round trip at this data volume.
    () => applyRestaurantFilters(toRestaurantViews(query.data?.restaurants ?? []), filters),
    [query.data, filters],
  );
  const dishes = toDishViews(query.data?.items ?? []);

  if (!coordinates) return <LocationGate />;

  const searching = term.length > 0;
  const nothingFound = searching && !query.isFetching && !restaurants.length && !dishes.length;

  return (
    <Screen edges={["top"]}>
      <View className="gap-3 pb-3 pt-2">
        <View className="gap-3 px-5">
          <SectionHeader
            title="Browse"
            size="lg"
            subtitle="Restaurants and dishes delivering to you"
          />
          <SearchInput
            value={text}
            onChangeText={setText}
            placeholder="Search dishes, restaurants…"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search restaurants and dishes"
            right={
              text ? (
                <IconButton
                  icon={X}
                  variant="muted"
                  size={30}
                  label="Clear search"
                  onPress={() => setText("")}
                />
              ) : null
            }
          />
        </View>
        {searching ? <SearchFilterBar filters={filters} onChange={setFilters} /> : null}
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-4 pb-44"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          dishes.length ? (
            <Rail
              title="Dishes"
              subtitle={`${dishes.length} matching ${dishes.length === 1 ? "dish" : "dishes"}`}
              data={dishes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DishCard
                  dish={item}
                  onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
                />
              )}
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <View className="gap-3 px-5">
            {index === 0 ? (
              <SectionHeader
                title="Restaurants"
                subtitle={`${restaurants.length} ${restaurants.length === 1 ? "place" : "places"} match`}
              />
            ) : null}
            <RestaurantCard
              restaurant={item}
              isFavourite={isFavourite(item.id)}
              onToggleFavourite={() => toggleFavourite(item.id)}
              onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          query.isFetching ? (
            <View className="gap-4 px-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-64 w-full rounded-lg" />
              ))}
            </View>
          ) : nothingFound ? (
            <EmptyState
              icon={SearchIcon}
              title={`Nothing for "${term}"`}
              description="Try a different dish or restaurant name, or clear your filters."
              actionLabel="Clear filters"
              onAction={() => setFilters(DEFAULT_SEARCH_FILTERS)}
            />
          ) : !searching && recent.length ? (
            <View className="gap-1 px-5">
              <View className="flex-row items-center justify-between pb-1">
                <Text variant="caption" tone="muted">
                  Recent searches
                </Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={clear}
                  className="active:opacity-60"
                >
                  <Text variant="label-sm" tone="primary">
                    Clear
                  </Text>
                </Pressable>
              </View>
              {recent.map((entry) => (
                <Pressable
                  key={entry}
                  accessibilityRole="button"
                  onPress={() => setText(entry)}
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
          ) : !searching ? (
            <EmptyState
              icon={SearchIcon}
              title="Find something to eat"
              description="Search restaurants and dishes delivering to your address."
            />
          ) : null
        }
      />
    </Screen>
  );
}
