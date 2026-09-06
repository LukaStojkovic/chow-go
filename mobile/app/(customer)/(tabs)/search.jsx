import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { Search as SearchIcon } from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { DishCard } from "@/components/discovery/DishCard";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { LocationGate } from "@/features/discover/LocationGate";
import { Rail } from "@/features/discover/Rail";
import { useDiscoverSearch } from "@/hooks/Discover/useDiscover";
import { useDeliveryStore } from "@/store/useDeliveryStore";

export default function Search() {
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");

  // Debounced: search is the tightest rate-limited endpoint on the backend, so
  // a request per keystroke would exhaust the budget in a single word.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  const query = useDiscoverSearch(term);

  if (!coordinates) return <LocationGate />;

  const restaurants = toRestaurantViews(query.data?.restaurants ?? []);
  const dishes = toDishViews(query.data?.items ?? []);
  const nothingFound = term && !query.isFetching && !restaurants.length && !dishes.length;

  return (
    <Screen edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
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
              description="Try a different dish or restaurant name."
            />
          ) : !term ? (
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
