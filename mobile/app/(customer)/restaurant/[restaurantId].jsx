import { useMemo, useRef, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import { Heart, Info } from "lucide-react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantView } from "@chowgo/shared/adapters/restaurant";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CategoryTabs } from "@/features/restaurant/CategoryTabs";
import { HERO_HEIGHT, ParallaxHero } from "@/features/restaurant/ParallaxHero";
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
  const [infoOpen, setInfoOpen] = useState(false);
  const listRef = useRef(null);
  const scrollY = useSharedValue(0);
  const [active, setActive] = useState(null);

  const restaurant = info.data ? toRestaurantView(info.data) : null;

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
      <Stack.Screen
        options={{
          title: restaurant?.name ?? "",
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => (
            <View className="flex-row gap-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restaurant information"
                hitSlop={8}
                onPress={() => setInfoOpen(true)}
                className="h-9 w-9 items-center justify-center rounded-full bg-black/45"
              >
                <Info size={17} color={color["scrim-foreground"]} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isFavourite(restaurantId) ? "Remove from favourites" : "Save to favourites"
                }
                hitSlop={8}
                onPress={() => toggleFavourite(restaurantId)}
                className="h-9 w-9 items-center justify-center rounded-full bg-black/45"
              >
                <Heart
                  size={17}
                  color={color["scrim-foreground"]}
                  fill={isFavourite(restaurantId) ? color["scrim-foreground"] : "transparent"}
                />
              </Pressable>
            </View>
          ),
        }}
      />
      <Screen edges={[]}>
        <AnimatedSectionList
          ref={listRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="pb-32"
          ListHeaderComponent={
            <>
              <ParallaxHero restaurant={restaurant} scrollY={scrollY} />
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
            <View className="bg-background px-5 pb-1 pt-5">
              <Text variant="h2">{section.title}</Text>
            </View>
          )}
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
              <View className="gap-4 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <View key={index} className="flex-row gap-3">
                    <View className="flex-1 gap-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </View>
                    <Skeleton className="h-20 w-20" />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState title="No menu yet" description="This restaurant hasn't added dishes." />
            )
          }
        />

        <RestaurantInfoSheet
          visible={infoOpen}
          restaurant={restaurant}
          onClose={() => setInfoOpen(false)}
        />
      </Screen>
    </>
  );
}
