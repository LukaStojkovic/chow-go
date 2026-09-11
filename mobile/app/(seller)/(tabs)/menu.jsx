import { useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Plus, UtensilsCrossed } from "lucide-react-native";
import { CATEGORIES } from "@chowgo/shared/constants";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SearchInput } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { SellerMenuItemRow } from "@/features/seller/MenuItemRow";
import { useMenuItems } from "@/hooks/Restaurants/useMenuItems";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

export default function SellerMenu() {
  const refreshTint = useRefreshTint();
  const { color } = useTokens();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text]);

  const query = useMenuItems({
    search: search || undefined,
    category: category || undefined,
    available: availableOnly ? "true" : undefined,
    limit: 50,
  });

  const items = query.data?.menuItems ?? [];

  return (
    <Screen edges={["top"]}>
      <View className="gap-3 pb-3 pt-2">
        <View className="gap-4 px-5">
          <View className="flex-row items-end justify-between gap-3">
            <SectionHeader
              title="Menu"
              size="lg"
              subtitle={`${items.length} ${items.length === 1 ? "dish" : "dishes"}`}
              className="flex-1"
            />

            <Button size="md" onPress={() => router.push("/(seller)/menu-item/new")}>
              <View className="flex-row items-center gap-1.5">
                <Plus size={16} strokeWidth={2.6} color={color["primary-foreground"]} />
                <Text variant="label" className="text-primary-foreground">
                  Add dish
                </Text>
              </View>
            </Button>
          </View>

          <SearchInput
            value={text}
            onChangeText={setText}
            placeholder="Search your dishes"
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
            label="Available only"
            active={availableOnly}
            showCheck
            onPress={() => setAvailableOnly((current) => !current)}
          />

          {CATEGORIES.filter((entry) => entry.id !== "all").map((entry) => (
            <Chip
              key={entry.id}
              label={entry.label}
              active={category === entry.value}
              onPress={() => setCategory(category === entry.value ? "" : entry.value)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item._id)}
        contentContainerClassName="gap-3 px-5 pb-32"
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
              title={search || category ? "Nothing matches" : "No dishes yet"}
              description={
                search || category
                  ? "Try a different search or category."
                  : "Add your first dish so customers can order it."
              }
              actionLabel={search || category ? undefined : "Add a dish"}
              onAction={() => router.push("/(seller)/menu-item/new")}
            />
          )
        }
      />
    </Screen>
  );
}
