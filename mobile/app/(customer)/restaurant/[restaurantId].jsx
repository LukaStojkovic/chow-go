import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Share, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Star, UtensilsCrossed } from "lucide-react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { StatusBar } from "expo-status-bar";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { menuGroupId, menuGroupLabel, toDishViews } from "@chowgo/shared/adapters/menu";
import { toRestaurantView, unavailableReason } from "@chowgo/shared/adapters/restaurant";
import { formatRating } from "@chowgo/shared/format";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Inset } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { CategoryTabs, PinnedCategoryTabs, TABS_HEIGHT } from "@/features/restaurant/CategoryTabs";
import { BAR_HEIGHT, CollapsingHeader, collapseOffset } from "@/features/restaurant/CollapsingHeader";
import { HERO_HEIGHT, ParallaxHero } from "@/features/restaurant/ParallaxHero";
import { MenuItemRow } from "@/features/restaurant/MenuItemRow";
import { RestaurantInfoSheet } from "@/features/restaurant/RestaurantInfoSheet";
import { activeSectionAt, buildMenuRows, headerIndexOf } from "@/features/restaurant/menuRows";
import { useFavouriteToggle } from "@/hooks/Favourites/useFavouriteToggle";
import { useRestaurant } from "@/hooks/Restaurants/useRestaurant";
import { WEB_URL } from "@/lib/config";
import { useMotion } from "@/theme/motion";
import { useTokens } from "@/theme/useTokens";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
const SPY_STEP = 16;
const JUMP_LOCK_MS = 700;

export default function RestaurantPage() {
  const { t } = useTranslation(["restaurant", "common"]);
  const { restaurantId } = useLocalSearchParams();
  const { info, menu } = useRestaurant(restaurantId);

  const { isFavourite, toggleFavourite } = useFavouriteToggle();
  const { color, isDark } = useTokens();
  const { isReduced } = useMotion();
  const insets = useSafeAreaInsets();
  const [infoOpen, setInfoOpen] = useState(false);
  const listRef = useRef(null);
  const scrollY = useSharedValue(0);
  const [active, setActive] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [tabsY, setTabsY] = useState(0);
  const jumpLock = useRef(null);

  const restaurant = info.data ? toRestaurantView(info.data) : null;
  const preorder = Boolean(restaurant?.orderAhead);
  const closedReason = preorder ? t("restaurant:availability.preorder") : unavailableReason(restaurant);
  const saved = isFavourite(restaurantId);

  const barHeight = insets.top + BAR_HEIGHT;
  const collapseAt = collapseOffset(barHeight, HERO_HEIGHT);
  const pinAt = tabsY > 0 ? tabsY - barHeight : 0;
  const pinLine = barHeight + TABS_HEIGHT;

  const sections = useMemo(
    () =>
      (menu.data ?? [])
        .map((group) => ({
          key: menuGroupId(group),
          title: menuGroupLabel(group),
          data: toDishViews(group.items ?? []),
        }))
        .filter((section) => section.data.length > 0),
    [menu.data, t],
  );
  const rows = useMemo(() => buildMenuRows(sections), [sections]);
  const headerRows = useMemo(
    () => rows.map((row, index) => (row.type === "header" ? { key: row.sectionKey, index } : null)).filter(Boolean),
    [rows],
  );
  const activeKey = active ?? sections[0]?.key;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => scrollY.value >= collapseAt - 30,
    (next, previous) => {
      if (next !== previous) runOnJS(setCollapsed)(next);
    },
    [collapseAt],
  );

  useAnimatedReaction(
    () => pinAt > 0 && scrollY.value >= pinAt,
    (next, previous) => {
      if (next !== previous) runOnJS(setPinned)(next);
    },
    [pinAt],
  );

  const spy = useCallback(
    (offset, viewableItems) => {
      if (jumpLock.current || headerRows.length === 0) return;
      const list = listRef.current;
      const y = offset ?? list?.getAbsoluteLastScrollOffset?.();
      const base = list?.getFirstItemOffset?.() ?? 0;
      const headers = headerRows.map(({ key, index }) => {
        const layout = list?.getLayout?.(index);
        return { key, y: layout ? layout.y + base : null };
      });

      if (y != null && headers.some((header) => header.y != null)) {
        setActive(activeSectionAt(headers, y + pinLine));
        return;
      }
      const first = viewableItems?.find((entry) => entry.item?.sectionKey);
      if (first) setActive(first.item.sectionKey);
    },
    [headerRows, pinLine],
  );

  useAnimatedReaction(
    () => Math.floor(scrollY.value / SPY_STEP),
    (next, previous) => {
      if (next !== previous && previous !== null) runOnJS(spy)(scrollY.value);
    },
    [spy],
  );

  const onViewableItemsChanged = useRef(null);
  onViewableItemsChanged.current = ({ viewableItems }) => spy(undefined, viewableItems);
  const viewabilityHandler = useRef((info) => onViewableItemsChanged.current?.(info)).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  useEffect(() => () => clearTimeout(jumpLock.current), []);

  function jumpTo(key) {
    const index = headerIndexOf(rows, key);
    if (index < 0) return;
    setActive(key);
    clearTimeout(jumpLock.current);
    jumpLock.current = setTimeout(() => {
      jumpLock.current = null;
    }, JUMP_LOCK_MS);
    listRef.current?.scrollToIndex({ index, animated: !isReduced, viewOffset: -pinLine });
  }

  function share() {
    if (!restaurant) return;
    Share.share({
      message: t("restaurant:screen.shareMessage", {
        name: restaurant.name,
        link: `${WEB_URL}/restaurant/${restaurant.id}`,
      }),
    }).catch(() => {});
  }

  if (info.isError) {
    return (
      <Screen className="justify-center">
        <EmptyState
          tone="danger"
          title={t("restaurant:error.title")}
          description={t("common:error.networkDescription")}
          actionLabel={t("common:actions.retry")}
          onAction={info.refetch}
        />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={collapsed ? (isDark ? "light" : "dark") : "light"} />

      <Screen edges={[]}>
        <AnimatedFlashList
          ref={listRef}
          data={rows}
          keyExtractor={(row) => row.id}
          getItemType={(row) => row.type}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 144 }}
          onViewableItemsChanged={viewabilityHandler}
          viewabilityConfig={viewabilityConfig}
          ListHeaderComponent={
            <View>
              <ParallaxHero restaurant={restaurant} preorder={preorder} scrollY={scrollY} />

              {closedReason ? (
                <Inset tone={preorder ? "citrus" : "warning"} className="mx-5 mb-1 mt-3 flex-row items-center gap-3">
                  <Text variant="body-sm" className={preorder ? "flex-1" : "flex-1 text-warning"}>
                    {closedReason}
                  </Text>
                </Inset>
              ) : null}

              {restaurant?.reviewCount ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("restaurant:reviews.seeAll")}
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/restaurant/reviews/[restaurantId]",
                      params: { restaurantId },
                    })
                  }
                  className="mx-5 mt-3 flex-row items-center gap-2 rounded-lg bg-card px-4 py-3 active:opacity-60"
                >
                  <Star size={16} color={color.rating} fill={color.rating} />
                  <Text variant="label">{formatRating(restaurant.rating) ?? "-"}</Text>
                  <Text variant="caption" tone="muted" className="flex-1" numberOfLines={1}>
                    {t("restaurant:reviews.basedOn", { count: restaurant.reviewCount })}
                  </Text>
                  <Text variant="label-sm" tone="primary">
                    {t("restaurant:reviews.seeAll")}
                  </Text>
                  <ChevronRight size={16} color={color.primary} />
                </Pressable>
              ) : null}

              {sections.length > 0 ? (
                <View onLayout={(event) => setTabsY(event.nativeEvent.layout.y)}>
                  <CategoryTabs sections={sections} active={activeKey} onSelect={jumpTo} hidden={pinned} />
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item: row }) =>
            row.type === "header" ? (
              <View className="flex-row items-center gap-2 bg-background px-5 pb-3 pt-6">
                <Text variant="h1" className="flex-1" numberOfLines={1} accessibilityRole="header">
                  {row.title}
                </Text>
                <Text variant="label-sm" tone="muted">
                  {t("common:count.dishes", { count: row.count })}
                </Text>
              </View>
            ) : (
              <View className="pb-3">
                <MenuItemRow
                  dish={row.dish}
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/item/[menuItemId]",
                      params: { menuItemId: row.dish.id, restaurantId },
                    })
                  }
                />
              </View>
            )
          }
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
                title={t("restaurant:menu.empty.title")}
                description={t("restaurant:menu.empty.description")}
              />
            )
          }
        />

        {sections.length > 0 ? (
          <PinnedCategoryTabs
            scrollY={scrollY}
            pinAt={pinAt}
            top={barHeight}
            pinned={pinned}
            sections={sections}
            active={activeKey}
            onSelect={jumpTo}
          />
        ) : null}

        <CollapsingHeader
          scrollY={scrollY}
          collapseAt={collapseAt}
          collapsed={collapsed}
          reduced={isReduced}
          topInset={insets.top}
          title={restaurant?.name ?? ""}
          saved={saved}
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/(customer)"))}
          onInfo={() => setInfoOpen(true)}
          onShare={share}
          onToggleFavourite={() => toggleFavourite(restaurantId)}
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
