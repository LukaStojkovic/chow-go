import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ListOrdered, Plus, RotateCcw, UtensilsCrossed } from "lucide-react-native";
import { categoryOptions } from "@chowgo/shared/constants";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { listGap } from "@/components/ui/ListGap";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SearchInput } from "@/components/ui/Input";
import { ListRow } from "@/components/ui/ListRow";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { SellerMenuItemRow } from "@/features/seller/MenuItemRow";
import { MenuStockSheet } from "@/features/seller/MenuStockSheet";
import { useMenuItemPages, useMenuItems, useOwnRestaurantId } from "@/hooks/Restaurants/useMenuItems";
import { restockAllSoldOut, useSetMenuItemStock } from "@/hooks/Restaurants/useMenuStock";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

export default function SellerMenu() {
  const refreshTint = useRefreshTint();
  const { color } = useTokens();
  const { t, i18n } = useTranslation(["seller", "common"]);
  const categories = useMemo(() => categoryOptions(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");
  const [stockTarget, setStockTarget] = useState(null);
  const [restock, setRestock] = useState(null);
  const restaurantId = useOwnRestaurantId();
  const stock = useSetMenuItemStock();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text]);

  const query = useMenuItemPages({
    search: search || undefined,
    category: category || undefined,
    available: availability || undefined,
  });
  const soldOutQuery = useMenuItems({ available: "false", limit: 1 });
  const soldOutCount = soldOutQuery.data?.pagination?.totalItems ?? 0;

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page?.menuItems ?? []),
    [query.data],
  );
  const totalItems = query.data?.pages?.[0]?.pagination?.totalItems ?? items.length;
  const filtered = Boolean(search || category || availability);
  const stockItem = stockTarget
    ? (items.find((item) => String(item._id) === String(stockTarget.item._id)) ?? stockTarget.item)
    : null;

  const setStock = ({ name, ...variables }) =>
    stock.mutate(variables, {
      onSuccess: () => Haptics.selectionAsync(),
      onError: (error) =>
        toast.error(t("stock.failed"), {
          description: name ? `${name} · ${errorMessage(error)}` : errorMessage(error),
        }),
    });

  const toggleStock = (item, next) => {
    if (next) setStock({ menuItemId: item._id, available: true, name: item.name });
    else setStockTarget({ item, mode: "dish" });
  };

  const restockAll = async () => {
    const progress = { done: 0, total: soldOutCount };
    setRestock({ ...progress });
    try {
      await restockAllSoldOut(restaurantId, stock.mutateAsync, (done, total) => {
        Object.assign(progress, { done, total });
        setRestock({ done, total });
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(t("stock.restocked"));
    } catch (error) {
      toast.error(t("stock.restockFailed", { count: Math.max(1, progress.total - progress.done) }), {
        description: errorMessage(error),
      });
    } finally {
      setRestock(null);
    }
  };

  return (
    <Screen edges={["top"]}>
      <View className="gap-3 pb-3 pt-2">
        <View className="gap-4 px-5">
          <View className="flex-row items-end justify-between gap-3">
            <SectionHeader
              title={t("menu.title")}
              size="lg"
              subtitle={t("common:count.dishes", { count: totalItems })}
              className="flex-1"
            />

            <Button size="md" onPress={() => router.push("/(seller)/menu-item/new")}>
              <View className="flex-row items-center gap-1.5">
                <Plus size={16} strokeWidth={2.6} color={color["primary-foreground"]} />
                <Text variant="label" className="text-primary-foreground">
                  {t("menu.addDish")}
                </Text>
              </View>
            </Button>
          </View>

          <Card className="py-0">
            <ListRow
              icon={ListOrdered}
              title={t("menuLayout.open")}
              onPress={() => router.push("/(seller)/menu-layout")}
            />
          </Card>

          <SearchInput
            value={text}
            onChangeText={setText}
            placeholder={t("menu.searchPlaceholder")}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5"
        >
          <Chip
            label={t("menu.onlyAvailable")}
            active={availability === "true"}
            showCheck
            onPress={() => setAvailability((current) => (current === "true" ? "" : "true"))}
          />

          {soldOutCount > 0 || availability === "false" ? (
            <Chip
              label={`${t("stock.filter")} (${soldOutCount})`}
              active={availability === "false"}
              showCheck
              onPress={() => setAvailability((current) => (current === "false" ? "" : "false"))}
            />
          ) : null}

          {categories.filter((entry) => entry.id !== "all").map((entry) => (
            <Chip
              key={entry.id}
              label={entry.label}
              active={category === entry.value}
              onPress={() => setCategory(category === entry.value ? "" : entry.value)}
            />
          ))}
        </ScrollView>

        {availability === "false" && soldOutCount > 0 ? (
          <View className="px-5">
            <Button
              variant="mint"
              size="md"
              fullWidth
              disabled={Boolean(restock)}
              onPress={restockAll}
            >
              <View className="flex-row items-center gap-1.5">
                <RotateCcw size={16} strokeWidth={2.4} color={color.primary} />
                <Text variant="label" className="text-primary-subtle-foreground">
                  {restock
                    ? t("stock.restocking", { done: restock.done, total: restock.total })
                    : t("stock.restockAll")}
                </Text>
              </View>
            </Button>
          </View>
        ) : null}
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => String(item._id)}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        contentContainerClassName="px-5 pb-32"
        ItemSeparatorComponent={listGap(3)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            {...refreshTint}
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
          />
        }
        renderItem={({ item }) => (
          <SellerMenuItemRow
            item={item}
            onPress={() => router.push(`/(seller)/menu-item/${item._id}`)}
            onToggleStock={toggleStock}
            onOpenOptions={(entry) => setStockTarget({ item: entry, mode: "options" })}
          />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-lg" />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={UtensilsCrossed}
              title={filtered ? t("menu.emptyMatch") : t("menu.emptyNone")}
              description={filtered ? t("menu.emptyMatchHint") : t("menu.emptyNoneHint")}
              actionLabel={filtered ? undefined : t("menu.addTitle")}
              onAction={() => router.push("/(seller)/menu-item/new")}
            />
          )
        }
      />

      <MenuStockSheet
        target={stockTarget}
        item={stockItem}
        onClose={() => setStockTarget(null)}
        onSet={setStock}
      />
    </Screen>
  );
}
