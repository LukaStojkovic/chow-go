import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { DishCard } from "@/components/discovery/DishCard";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Rail } from "@/features/discover/Rail";

export function collectionHref(slug) {
  return `/(customer)/collection/${encodeURIComponent(slug)}`;
}

export function closedRestaurantIds(items) {
  return new Set(
    (items ?? [])
      .filter((item) => item?.restaurant?.isOpenNow === false)
      .map((item) => String(item.restaurant._id)),
  );
}

export function CollectionRails({ query, isFavourite, toggleFavourite }) {
  const { t } = useTranslation("discover");

  if (query.isLoading) {
    return (
      <View className="gap-3" testID="collections-loading">
        <View className="gap-1.5 px-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </View>
        <View className="flex-row gap-3 px-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-64 rounded-lg" />
          ))}
        </View>
      </View>
    );
  }

  if (query.isError || !query.data?.length) return null;

  return query.data.map((collection) => (
    <CollectionRail
      key={collection.id}
      collection={collection}
      isFavourite={isFavourite}
      toggleFavourite={toggleFavourite}
      seeAllLabel={t("discover:collections.seeAll")}
      seeAllAccessibilityLabel={t("discover:collections.seeAllLabel", { title: collection.title })}
    />
  ));
}

function CollectionRail({ collection, isFavourite, toggleFavourite, seeAllLabel, seeAllAccessibilityLabel }) {
  const seeAll = collection.hasMore ? () => router.push(collectionHref(collection.slug)) : undefined;
  const shared = {
    title: collection.title,
    subtitle: collection.subtitle ?? undefined,
    onAction: seeAll,
    actionLabel: seeAll ? seeAllLabel : undefined,
    actionAccessibilityLabel: seeAll ? seeAllAccessibilityLabel : undefined,
    keyExtractor: (item) => item.id,
  };

  if (collection.kind === "dishes") {
    const closed = closedRestaurantIds(collection.items);
    return (
      <Rail
        {...shared}
        data={toDishViews(collection.items ?? [])}
        renderItem={({ item }) => (
          <DishCard
            dish={item}
            closed={closed.has(item.restaurantId)}
            onPress={() => router.push(`/(customer)/restaurant/${item.restaurantId}`)}
          />
        )}
      />
    );
  }

  return (
    <Rail
      {...shared}
      data={toRestaurantViews(collection.items ?? [])}
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
  );
}
