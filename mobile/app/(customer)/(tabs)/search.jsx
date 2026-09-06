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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
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
        <View className="px-5">
          <Input
            value={text}
            onChangeText={setText}
            placeholder="Restaurants or dishes"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search restaurants and dishes"
          />
        </View>
        {searching ? <SearchFilterBar filters={filters} onChange={setFilters} /> : null}
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-5 pb-28"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          dishes.length ? (
            <View className="pb-1">
              <Rail
                title="Dishes"
                data={dishes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <DishCard
                    dish={item}
                    onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
                  />
                )}
              />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View className="px-5">
            {index === 0 ? (
              <Text variant="h2" className="pb-3">
                Restaurants
              </Text>
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
            <View className="gap-5 px-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} className="gap-2">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </View>
              ))}
            </View>
          ) : nothingFound ? (
            <EmptyState
              icon={SearchIcon}
              title={`Nothing for "${term}"`}
              description="Try a different dish or restaurant name, or clear your filters."
            />
          ) : !searching && recent.length ? (
            <View className="gap-2 px-5">
              <View className="flex-row items-center justify-between">
                <Text variant="label" tone="muted">
                  Recent
                </Text>
                <Button size="sm" variant="ghost" onPress={clear}>
                  Clear
                </Button>
              </View>
              {recent.map((entry) => (
                <Pressable
                  key={entry}
                  accessibilityRole="button"
                  onPress={() => setText(entry)}
                  className="flex-row items-center gap-3 py-2.5 active:opacity-60"
                >
                  <Clock size={15} color={color["muted-foreground"]} />
                  <Text variant="body" className="flex-1">
                    {entry}
                  </Text>
                  <X size={14} color={color["muted-foreground"]} />
                </Pressable>
              ))}
            </View>
          ) : !searching ? (
            <EmptyState
              icon={SearchIcon}
              title="Find something to eat"
              description="Search restaurants and dishes delivering to you."
            />
          ) : null
        }
      />
    </Screen>
  );
}
