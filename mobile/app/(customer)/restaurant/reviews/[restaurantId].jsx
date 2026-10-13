import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MessageSquareText } from "lucide-react-native";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Chip, ChipRow } from "@/components/ui/Chip";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { ReviewCard } from "@/features/reviews/ReviewCard";
import { ReviewSummary } from "@/features/reviews/ReviewSummary";
import { useRestaurant } from "@/hooks/Restaurants/useRestaurant";
import { flattenReviews, summaryOf, useRestaurantReviews } from "@/hooks/Reviews/useReviews";
import { useTokens } from "@/theme/useTokens";

export default function RestaurantReviews() {
  const { t } = useTranslation(["restaurant", "common"]);
  const { restaurantId } = useLocalSearchParams();
  const { info } = useRestaurant(restaurantId);
  const { color } = useTokens();
  const [withText, setWithText] = useState(false);

  const reviews = useRestaurantReviews(restaurantId, { withText: withText ? "true" : undefined });
  const items = flattenReviews(reviews.data);
  const summary = summaryOf(reviews.data);
  const restaurantName = info.data?.name;

  const loadMore = () => {
    if (reviews.hasNextPage && !reviews.isFetchingNextPage) reviews.fetchNextPage();
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("restaurant:reviews.title")} subtitle={restaurantName} />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="gap-3 px-5 pb-8"
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View className="gap-3">
            <ReviewSummary summary={summary} />
            <View className="-mx-5">
              <ChipRow>
                <Chip label={t("restaurant:reviews.filterAll")} active={!withText} onPress={() => setWithText(false)} />
                <Chip label={t("restaurant:reviews.withText")} active={withText} onPress={() => setWithText(true)} />
              </ChipRow>
            </View>
          </View>
        }
        renderItem={({ item }) => <ReviewCard review={item} restaurantName={restaurantName} />}
        ListEmptyComponent={
          reviews.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-lg" />
              ))}
            </View>
          ) : reviews.isError ? (
            <EmptyState
              tone="danger"
              title={t("common:error.generic")}
              actionLabel={t("common:actions.retry")}
              onAction={reviews.refetch}
            />
          ) : (
            <EmptyState icon={MessageSquareText} title={t("restaurant:reviews.empty")} />
          )
        }
        ListFooterComponent={
          reviews.isFetchingNextPage ? (
            <ActivityIndicator color={color.primary} />
          ) : reviews.hasNextPage ? (
            <Button variant="outline" onPress={loadMore}>
              {t("restaurant:reviews.loadMore")}
            </Button>
          ) : null
        }
      />
    </Screen>
  );
}
