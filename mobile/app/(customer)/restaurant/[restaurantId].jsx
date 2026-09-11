import { useMemo, useRef, useState } from "react";
import { SectionList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Heart, Info, UtensilsCrossed } from "lucide-react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantView, unavailableReason } from "@chowgo/shared/adapters/restaurant";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { IconButton } from "@/components/ui/Button";
import { Inset } from "@/components/ui/Card";

import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CategoryTabs } from "@/features/restaurant/CategoryTabs";
import { ParallaxHero } from "@/features/restaurant/ParallaxHero";
import { MenuItemRow } from "@/features/restaurant/MenuItemRow";
import { RestaurantInfoSheet } from "@/features/restaurant/RestaurantInfoSheet";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useRestaurant } from "@/hooks/Restaurants/useRestaurant";
import { useTokens } from "@/theme/useTokens";

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

export default function RestaurantPage() {
  const { restaurantId } = useLocalSearchParams();
  const { info, menu } = useRestaurant(restaurantId);

  const { isFavourite, toggleFavourite } = useFavouriteToggle();
  const { color } = useTokens();
  const insets = useSafeAreaInsets();
  const [infoOpen, setInfoOpen] = useState(false);
  const listRef = useRef(null);
  const scrollY = useSharedValue(0);
  const [active, setActive] = useState(null);

  const restaurant = info.data ? toRestaurantView(info.data) : null;
  const closedReason = unavailableReason(restaurant);
  const saved = isFavourite(restaurantId);

  const sections = useMemo(
    () =>
      (menu.data ?? [])
        .map((group) => ({
          title: group.category ?? group._id ?? "Menu",
          data: toDishViews(group.items ?? []),
        }))
        .filter((section) => section.data.length > 0),
    [menu.data],
  );

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  function jumpTo(title) {
    const index = sections.findIndex((section) => section.title === title);
    if (index < 0) return;
    setActive(title);
    listRef.current?.scrollToLocation({
      sectionIndex: index,
      itemIndex: 0,
      viewOffset: 56,
      animated: true,
    });
  }

  if (info.isError) {
    return (
      <Screen className="justify-center">
        <EmptyState
          tone="danger"
          title="Couldn't load this restaurant"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={info.refetch}
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Screen edges={[]}>
        <AnimatedSectionList
          ref={listRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="pb-36"
          ListHeaderComponent={
            <>
              <ParallaxHero restaurant={restaurant} scrollY={scrollY} />

              {closedReason ? (
                <Inset tone="warning" className="mx-5 mb-1 mt-3 flex-row items-center gap-3">
                  <Text variant="body-sm" className="flex-1 text-warning">
                    {closedReason}
                  </Text>
                </Inset>
              ) : null}

              {sections.length > 0 ? (
                <CategoryTabs
                  sections={sections}
                  active={active ?? sections[0]?.title}
                  onSelect={jumpTo}
                />
              ) : null}
            </>
          }
          // Drives the sticky rail from the list's own position; the RN
          // equivalent of the web's IntersectionObserver scroll-spy.
          onViewableItemsChanged={
            useRef(({ viewableItems }) => {
              const first = viewableItems.find((entry) => entry.section);
              if (first?.section?.title) setActive(first.section.title);
            }).current
          }
          viewabilityConfig={useRef({ itemVisiblePercentThreshold: 40 }).current}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center gap-2 bg-background px-5 pb-3 pt-6">
              <Text variant="h1" className="flex-1" numberOfLines={1}>
                {section.title}
              </Text>
              <Text variant="label-sm" tone="muted">
                {section.data.length} {section.data.length === 1 ? "dish" : "dishes"}
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <MenuItemRow
              dish={item}
              onPress={() =>
                router.push({
                  pathname: "/(customer)/item/[menuItemId]",
                  params: { menuItemId: item.id, restaurantId },
                })
              }
            />
          )}
          ListEmptyComponent={
            menu.isLoading ? (
              <View className="gap-3 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <View key={index} className="flex-row gap-3 rounded-lg bg-card p-3">
                    <View className="flex-1 gap-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </View>
                    <Skeleton className="h-24 w-24" />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={UtensilsCrossed}
                title="No menu yet"
                description="This restaurant hasn't added any dishes."
              />
            )
          }
        />

        {/* Header chrome floats over the photograph rather than sitting in a
             bar: there is no title to show until the hero has scrolled away, and
             a solid bar over the hero would waste the image. */}
        <View
          pointerEvents="box-none"
          style={{ top: insets.top + 6 }}
          className="absolute left-5 right-5 flex-row items-center justify-between"
        >
          <IconButton
            icon={ArrowLeft}
            variant="scrim"
            label="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(customer)"))}
          />

          <View className="flex-row gap-2">
            <IconButton
              icon={Info}
              variant="scrim"
              label="Restaurant information"
              onPress={() => setInfoOpen(true)}
            />

            <IconButton
              icon={Heart}
              variant="scrim"
              label={saved ? "Remove from favourites" : "Save to favourites"}
              onPress={() => toggleFavourite(restaurantId)}
              className={saved ? "bg-primary" : undefined}
            />
          </View>
        </View>

        <RestaurantInfoSheet
          visible={infoOpen}
          restaurant={restaurant}
          onClose={() => setInfoOpen(false)}
        />
      </Screen>
    </>
  );
}
