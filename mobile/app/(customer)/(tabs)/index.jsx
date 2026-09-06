import { useCallback, useState } from "react";
import { RefreshControl, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { CategoryRail } from "@/components/discovery/CategoryRail";
import { DishCard } from "@/components/discovery/DishCard";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { LocationGate } from "@/features/discover/LocationGate";
import { Rail } from "@/features/discover/Rail";
import { useDiscoverFeed, usePopularItems, usePromotions } from "@/hooks/Discover/useDiscover";
import { useDeliveryStore } from "@/store/useDeliveryStore";

export default function Discover() {
  const { address, coordinates } = useDeliveryStore();
  const [category, setCategory] = useState("All");

  const feed = useDiscoverFeed(category);
  const popular = usePopularItems();
  const promotions = usePromotions();

  const dishes = toDishViews(feed.data?.pages.flatMap((page) => page.items) ?? []);

  const onRefresh = useCallback(() => {
    feed.refetch();
    popular.refetch();
    promotions.refetch();
  }, [feed, popular, promotions]);

  if (!coordinates) return <LocationGate />;

  return (
    <Screen edges={["top"]}>
      <FlashList
        data={dishes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        estimatedItemSize={210}
        contentContainerClassName="pb-28"
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        ListHeaderComponent={
          <View className="gap-6 pb-4">
            <View className="gap-0.5 px-5 pt-2">
              <Text variant="caption" tone="muted">
                Delivering to
              </Text>
              <Text variant="h3" numberOfLines={1}>
                {address ?? "Current location"}
              </Text>
            </View>

            {/* Each section owns its own error state, so one failing endpoint
                degrades a single rail instead of blanking the screen. */}
            <Rail
              title="Deals"
              data={toDishViews(promotions.data?.deals ?? [])}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DishCard
                  dish={item}
                  onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
                />
              )}
            />

            <Rail
              title="New in town"
              data={toRestaurantViews(promotions.data?.newRestaurants ?? [])}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="w-64">
                  <RestaurantCard
                    restaurant={item}
                    onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
                  />
                </View>
              )}
            />

            <Rail
              title="Popular near you"
              data={toDishViews(popular.data ?? [])}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DishCard
                  dish={item}
                  onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
                />
              )}
            />

            <View className="gap-3">
              <Text variant="h2" className="px-5">
                Browse
              </Text>
              <CategoryRail value={category} onChange={setCategory} />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <View className={index % 2 === 0 ? "pb-4 pl-5 pr-1.5" : "pb-4 pl-1.5 pr-5"}>
            <DishCard
              dish={item}
              onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="flex-row flex-wrap gap-3 px-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} className="w-[47%] gap-2">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </View>
              ))}
            </View>
          ) : feed.isError ? (
            <EmptyState
              title="Couldn't load the feed"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={feed.refetch}
            />
          ) : (
            <EmptyState
              title="Nothing here yet"
              description={`No ${category === "All" ? "dishes" : category.toLowerCase()} delivering to you right now.`}
            />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View className="items-center py-6">
              <Text variant="body-sm" tone="muted">
                Loading more…
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
