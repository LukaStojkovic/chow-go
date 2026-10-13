import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { LayoutGrid, SearchX } from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { DishCard } from "@/components/discovery/DishCard";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { closedRestaurantIds } from "@/features/collections/CollectionRails";
import { LocationGate } from "@/features/discover/LocationGate";
import { useCollection } from "@/hooks/Discover/useDiscover";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useTokens } from "@/theme/useTokens";

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function CollectionScreen({ slug }) {
  const { t } = useTranslation(["discover", "common"]);
  const coordinates = useDeliveryStore((state) => state.coordinates);
  const { isFavourite, toggleFavourite } = useFavouriteToggle();
  const { color } = useTokens();
  const query = useCollection(slug);

  const pages = query.data?.pages;
  const collection = pages?.[0]?.collection;
  const total = pages?.[0]?.pagination?.total ?? 0;
  const isDishes = collection?.kind === "dishes";

  const rawItems = useMemo(() => (pages ?? []).flatMap((page) => page.items), [pages]);
  const items = useMemo(
    () => (isDishes ? toDishViews(rawItems) : toRestaurantViews(rawItems)),
    [isDishes, rawItems],
  );
  const closed = useMemo(() => closedRestaurantIds(isDishes ? rawItems : []), [isDishes, rawItems]);

  if (!coordinates) return <LocationGate />;

  const notFound = query.error?.response?.status === 404;

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  };

  if (notFound) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState
          icon={SearchX}
          title={t("discover:collections.notFound")}
          actionLabel={t("discover:collections.backHome")}
          onAction={goHome}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={collection?.title} />

      <FlatList
        key={isDishes ? "dishes" : "restaurants"}
        data={items}
        numColumns={isDishes ? 2 : 1}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-44"
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
        ListHeaderComponent={
          collection ? (
            <View className="gap-3 px-5 pb-5">
              {collection.coverImage ? (
                <View className="aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                  <Image
                    source={cloudinaryUrl(collection.coverImage, { width: 1200 })}
                    style={{ flex: 1 }}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                    accessibilityIgnoresInvertColors
                  />
                </View>
              ) : null}
              <View className="gap-1">
                <Text variant="h1">{collection.title}</Text>
                {collection.subtitle ? (
                  <Text variant="body" tone="muted">
                    {collection.subtitle}
                  </Text>
                ) : null}
                <Text variant="label-sm" tone="primary">
                  {isDishes
                    ? t("discover:collections.countDishes", { count: total })
                    : t("discover:collections.countRestaurants", { count: total })}
                </Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) =>
          isDishes ? (
            <View className={index % 2 === 0 ? "w-1/2 pb-3 pl-5 pr-1.5" : "w-1/2 pb-3 pl-1.5 pr-5"}>
              <DishCard
                dish={item}
                className="w-full"
                closed={closed.has(item.restaurantId)}
                onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
              />
            </View>
          ) : (
            <View className="px-5 pb-4">
              <RestaurantCard
                restaurant={item}
                isFavourite={isFavourite(item.id)}
                onToggleFavourite={() => toggleFavourite(item.id)}
                onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
              />
            </View>
          )
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-4 px-5" testID="collection-loading">
              <Skeleton className="h-7 w-48" />
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-56 w-full rounded-lg" />
              ))}
            </View>
          ) : query.isError ? (
            <EmptyState
              tone="danger"
              title={t("common:error.generic")}
              description={t("common:error.networkDescription")}
              actionLabel={t("common:actions.retry")}
              onAction={() => query.refetch()}
            />
          ) : (
            <EmptyState icon={LayoutGrid} title={t("discover:collections.empty")} />
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="items-center py-4">
              <ActivityIndicator color={color.primary} />
            </View>
          ) : query.hasNextPage ? (
            <View className="items-center px-5 pt-2">
              <Button variant="secondary" onPress={loadMore}>
                {t("discover:collections.loadMore")}
              </Button>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
