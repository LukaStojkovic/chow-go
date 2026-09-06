import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { Screen } from "@/components/ui/Screen";
import { useFavourites, useToggleFavourite } from "@/hooks/Favourites/useFavourites";
import { useAuthStore } from "@/store/useAuthStore";

export default function Favourites() {
  const authUser = useAuthStore((state) => state.authUser);
  const query = useFavourites();
  const toggle = useToggleFavourite();

  if (!authUser) {
    return (
      <Screen edges={["top"]} className="justify-center">
        <EmptyState
          icon={Heart}
          title="Sign in to save favourites"
          description="Keep the places you order from most in one list."
          actionLabel="Sign in"
          onAction={() => router.push("/(auth)/login")}
        />
      </Screen>
    );
  }

  const restaurants = toRestaurantViews(query.data ?? []);

  return (
    <Screen edges={["top"]}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-5 px-5 pb-28 pt-3"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
        }
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            isFavourite
            onToggleFavourite={() => toggle.mutate(item.id)}
            onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} className="gap-2">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Heart}
              title="No favourites yet"
              description="Tap the heart on a restaurant to save it here."
            />
          )
        }
      />
    </Screen>
  );
}
