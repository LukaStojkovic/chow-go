import { ScrollView, View } from "react-native";
import { Clock, SlidersHorizontal, X } from "lucide-react-native";
import { SORT_OPTIONS } from "@chowgo/shared/constants";
import { DEFAULT_SEARCH_FILTERS, countActiveFilters } from "@chowgo/shared/searchFilters";
import { Chip } from "@/components/ui/Chip";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

/**
 * Two rails: what to include, then how to order it.
 *
 * They are kept apart because they are different kinds of decision - the first
 * removes results, the second only rearranges them - and a single row of pills
 * makes the two look interchangeable.
 */
export function SearchFilterBar({ filters, onChange }) {
  const active = countActiveFilters(filters);
  const set = (patch) => onChange({ ...filters, ...patch });
  const { color } = useTokens();

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-5"
      >
        <Chip
          label="Open now"
          icon={Clock}
          active={filters.openNow}
          onPress={() => set({ openNow: !filters.openNow })}
        />
        {["30", "45", "60"].map((minutes) => (
          <Chip
            key={minutes}
            label={`Under ${minutes} min`}
            active={filters.maxDeliveryTime === minutes}
            onPress={() =>
              set({ maxDeliveryTime: filters.maxDeliveryTime === minutes ? "any" : minutes })
            }
          />
        ))}
        {active > 0 ? (
          <Chip
            label={`Clear ${active}`}
            icon={X}
            active={false}
            onPress={() => onChange(DEFAULT_SEARCH_FILTERS)}
          />
        ) : null}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2 px-5"
      >
        <View className="flex-row items-center gap-1.5 pr-1">
          <SlidersHorizontal size={13} color={color["muted-foreground"]} />
          <Text variant="caption" tone="muted">
            Sort
          </Text>
        </View>
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={filters.sort === option.value}
            onPress={() => set({ sort: option.value })}
            className="h-9"
          />
        ))}
      </ScrollView>
    </View>
  );
}
