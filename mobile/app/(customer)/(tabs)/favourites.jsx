import { FlatList, RefreshControl, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { toRestaurantViews } from "@chowgo/shared/adapters/restaurant";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { RestaurantCard } from "@/components/discovery/RestaurantCard";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { useFavourites } from "@/hooks/Favourites/useFavourites";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { useRefreshTint } from "@/theme/useRefreshTint";

export default function Favourites() {
  const { t } = useTranslation(["restaurant", "auth", "basket", "common"]);
  const refreshTint = useRefreshTint();
  const authUser = useAuthStore((state) => state.authUser);
  const query = useFavourites();
  const { toggleFavourite } = useFavouriteToggle();

  if (!authUser) {
    return (
      <Screen edges={["top"]} className="justify-center">
        <EmptyState
          icon={Heart}
          title={t("auth:guard.signInToFavourite")}
          description={t("restaurant:favourites.guestHint")}
          actionLabel={t("auth:login.submit")}
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
        contentContainerClassName="gap-4 px-5 pb-44"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SectionHeader
            title={t("restaurant:favourites.title")}
            size="lg"
            subtitle={`${restaurants.length} ${restaurants.length === 1 ? "restaurant" : "restaurants"} you come back to`}
            className="pb-1 pt-2"
          />
        }
        refreshControl={
          <RefreshControl
            {...refreshTint}
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
          />
        }
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            isFavourite
            onToggleFavourite={() => toggleFavourite(item.id)}
            onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-64 w-full rounded-lg" />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Heart}
              title={t("restaurant:favourites.empty.title")}
              description={t("restaurant:favourites.empty.description")}
              actionLabel={t("basket:empty.action")}
              onAction={() => router.push("/(customer)/(tabs)")}
            />
          )
        }
      />
    </Screen>
  );
}
