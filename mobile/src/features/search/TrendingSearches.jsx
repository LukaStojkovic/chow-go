import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TrendingUp, UtensilsCrossed } from "lucide-react-native";
import { cuisineLabel } from "@chowgo/shared/constants";
import { Chip } from "@/components/ui/Chip";
import { Text } from "@/components/ui/Text";

export function trendLabel(t, entry) {
  if (entry.kind === "cuisine") return cuisineLabel(t, entry.value);
  if (entry.kind === "category") {
    return t(`common:taxonomy.category.${entry.value}`, { defaultValue: entry.value });
  }
  return entry.value;
}

function ChipSection({ title, items, icon, onSearch }) {
  if (!items.length) return null;
  return (
    <View className="gap-2">
      <Text variant="caption" tone="muted" className="px-5">
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-2 px-5"
      >
        {items.map((label) => (
          <Chip key={label} label={label} icon={icon} active={false} onPress={() => onSearch(label)} />
        ))}
      </ScrollView>
    </View>
  );
}

export function TrendingSearches({ trending = [], cuisines = [], onSearch }) {
  const { t } = useTranslation(["discover", "common"]);
  const trendLabels = [...new Set(trending.map((entry) => trendLabel(t, entry)).filter(Boolean))];
  const cuisineLabels = [...new Set(cuisines.map((slug) => cuisineLabel(t, slug)))];

  if (!trendLabels.length && !cuisineLabels.length) return null;

  return (
    <View className="gap-4">
      <ChipSection
        title={t("discover:search.trending")}
        items={trendLabels}
        icon={TrendingUp}
        onSearch={onSearch}
      />
      <ChipSection
        title={t("discover:search.popularCuisines")}
        items={cuisineLabels}
        icon={UtensilsCrossed}
        onSearch={onSearch}
      />
    </View>
  );
}
