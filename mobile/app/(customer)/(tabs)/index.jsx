import { useCallback, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  Bell,
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { CategoryRail } from "@/components/discovery/CategoryRail";
import { DishCard, DishRow } from "@/components/discovery/DishCard";
import { PromoBanner } from "@/components/discovery/PromoBanner";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { LocationGate } from "@/features/discover/LocationGate";
import { Rail } from "@/features/discover/Rail";
import {
  useDiscoverFeed,
  useNearbyRestaurants,
  usePopularItems,
  usePromotions,
} from "@/hooks/Discover/useDiscover";
import { useCustomerOrders } from "@/hooks/Orders/useOrders";
import { useReorder } from "@/hooks/Orders/useReorder";
import { ReplaceBasketPrompt } from "@/features/basket/ReplaceBasketPrompt";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

export default function Discover() {
  const refreshTint = useRefreshTint();
  const { address, coordinates } = useDeliveryStore();
  const [category, setCategory] = useState("All");
  const { color, elevation, scheme } = useTokens();

  const { isFavourite, toggleFavourite } = useFavouriteToggle();
  const feed = useDiscoverFeed(category);
  const popular = usePopularItems();
  const promotions = usePromotions();
  const nearby = useNearbyRestaurants();

  // Past orders only mean something once there is an account behind them.
  const authUser = useAuthStore((state) => state.authUser);
  const pastOrders = useCustomerOrders(authUser ? { status: "delivered", limit: 5 } : undefined);
  const { reorder, conflict, confirmReplace, cancelReplace } = useReorder();

  const dishes = toDishViews(feed.data?.pages.flatMap((page) => page.items) ?? []);
  const deals = toDishViews(promotions.data?.deals ?? []);
  const topDiscount = Math.max(0, ...deals.map((deal) => deal.discountPercent ?? 0));

  const onRefresh = useCallback(() => {
    feed.refetch();
    popular.refetch();
    promotions.refetch();
    nearby.refetch();
  }, [feed, popular, promotions, nearby]);

  if (!coordinates) return <LocationGate />;

  return (
    <Screen edges={["top"]}>
      <FlashList
        data={dishes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        estimatedItemSize={240}
        contentContainerClassName="pb-44"
        refreshControl={
          <RefreshControl {...refreshTint} refreshing={feed.isRefetching} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.6}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        ListHeaderComponent={
          <View className="gap-7 pb-5">
            {/* The delivery address is the context every other screen inherits,
               so it lives in the header rather than somewhere in the feed. */}
            <View className="flex-row items-center gap-3 px-5 pt-1">
              <BrandLogo tight size={22} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change delivery address"
                onPress={() => router.push("/(customer)/address")}
                className="flex-1 active:opacity-60"
              >
                <View className="flex-row items-center gap-1">
                  <MapPin size={11} color={color.primary} />
                  <Text variant="caption" tone="primary">
                    Delivering to
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text variant="h3" numberOfLines={1} className="flex-1">
                    {address ?? "Current location"}
                  </Text>
                  <ChevronDown size={16} color={color.foreground} />
                </View>
              </Pressable>
              <IconButton
                icon={Bell}
                variant="surface"
                label="Your orders"
                onPress={() => router.push("/(customer)/orders")}
                style={elevation.subtle[scheme]}
              />
            </View>

            <Pressable
              accessibilityRole="search"
              accessibilityLabel="Search dishes and restaurants"
              onPress={() => router.push("/(customer)/search")}
              style={elevation.subtle[scheme]}
              className="mx-5 h-14 flex-row items-center gap-3 rounded-full bg-card px-5 active:opacity-80"
            >
              <Search size={20} color={color["muted-foreground"]} />
              <Text variant="body-lg" tone="muted">
                Search dishes, restaurants…
              </Text>
            </Pressable>

            <CategoryRail value={category} onChange={setCategory} />

            {deals.length ? (
              <View className="px-5">
                <PromoBanner
                  title={`${deals.length} ${deals.length === 1 ? "dish" : "dishes"} on offer near you`}
                  subtitle="The discount is already in the price you see."
                  image={deals[0]?.image}
                  badge={topDiscount ? `-${topDiscount}%` : undefined}
                  onPress={() => router.push("/(customer)/search")}
                />
              </View>
            ) : null}

            {/* Each section owns its own error state, so one failing endpoint
               degrades a single rail instead of blanking the screen. */}
            <Rail
              title="Deals"
              subtitle="Marked down right now"
              data={deals}
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
              subtitle="Just started delivering"
              icon={Sparkles}
              data={toRestaurantViews(promotions.data?.newRestaurants ?? [])}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  isFavourite={isFavourite(item.id)}
                  onToggleFavourite={() => toggleFavourite(item.id)}
                  onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
                  className="w-72"
                />
              )}
            />

            <Rail
              title="Order again"
              subtitle="Straight back into your basket"
              data={authUser ? (pastOrders.data?.orders ?? []) : []}
              keyExtractor={(item) => String(item._id)}
              renderItem={({ item }) => <ReorderCard order={item} onPress={() => reorder(item)} />}
            />

            <Rail
              title="Trending near you"
              subtitle="Top picks close to your address"
              icon={TrendingUp}
              data={toRestaurantViews(nearby.data ?? [])}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  isFavourite={isFavourite(item.id)}
                  onToggleFavourite={() => toggleFavourite(item.id)}
                  onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
                  className="w-72"
                />
              )}
            />

            {/* Popular runs vertically rather than as a rail: these are single
               dishes, and the row form is what lets the description earn its
               place on the screen. */}
            {popular.data?.length ? (
              <View className="gap-3">
                <SectionHeader
                  title="Popular quick bites"
                  subtitle="Most ordered around you"
                  className="px-5"
                />

                <View className="gap-3 px-5">
                  {toDishViews(popular.data)
                    .slice(0, 4)
                    .map((dish) => (
                      <DishRow
                        key={dish.id}
                        dish={dish}
                        meta={dish.restaurantName}
                        onPress={() => router.push(`/(customer)/restaurant/${dish.restaurantId}`)}
                      />
                    ))}
                </View>
              </View>
            ) : null}

            <SectionHeader
              title={category === "All" ? "All dishes" : category}
              subtitle="Everything delivering to you"
              className="px-5"
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <View className={index % 2 === 0 ? "pb-3 pl-5 pr-1.5" : "pb-3 pl-1.5 pr-5"}>
            <DishCard
              dish={item}
              className="w-full"
              onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          feed.isLoading ? (
            <View className="flex-row flex-wrap gap-3 px-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={index} className="w-[47%] gap-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </View>
              ))}
            </View>
          ) : feed.isError ? (
            <EmptyState
              tone="danger"
              title="Couldn't load the feed"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={feed.refetch}
            />
          ) : (
            <EmptyState
              icon={Utensils}
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

      <ReplaceBasketPrompt
        visible={Boolean(conflict)}
        currentRestaurantName={conflict?.currentRestaurantName}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </Screen>
  );
}

function ReorderCard({ order, onPress }) {
  const view = toOrderView(order);
  const { color, elevation, scheme } = useTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order again from ${view.restaurant?.name}`}
      onPress={onPress}
      style={elevation.subtle[scheme]}
      className="w-64 gap-2 rounded-lg bg-card p-4 active:opacity-90"
    >
      <Text variant="h3" numberOfLines={1}>
        {view.restaurant?.name}
      </Text>
      <Text variant="body-sm" tone="muted" numberOfLines={1}>
        {view.itemCount} {view.itemCount === 1 ? "item" : "items"} · {view.placedAtLabel}
      </Text>
      <View className="mt-1 flex-row items-center gap-1.5 self-start rounded-full bg-primary-subtle px-3 py-1.5">
        <TrendingUp size={13} color={color.primary} />
        <Text variant="label-sm" tone="primary">
          Order again
        </Text>
      </View>
    </Pressable>
  );
}
