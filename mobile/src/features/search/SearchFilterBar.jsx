import { ScrollView, View } from "react-native";
import { SORT_OPTIONS } from "@chowgo/shared/constants";
import { DEFAULT_SEARCH_FILTERS, countActiveFilters } from "@chowgo/shared/searchFilters";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export function SearchFilterBar({ filters, onChange }) {
  const active = countActiveFilters(filters);
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-5"
      >
        <Button
          size="sm"
          variant={filters.openNow ? "primary" : "outline"}
          onPress={() => set({ openNow: !filters.openNow })}
        >
          Open now
        </Button>
        {["30", "45", "60"].map((minutes) => (
          <Button
            key={minutes}
            size="sm"
            variant={filters.maxDeliveryTime === minutes ? "primary" : "outline"}
            onPress={() =>
              set({ maxDeliveryTime: filters.maxDeliveryTime === minutes ? "any" : minutes })
            }
          >
            {`Under ${minutes} min`}
          </Button>
        ))}
        {active > 0 ? (
          <Button size="sm" variant="ghost" onPress={() => onChange(DEFAULT_SEARCH_FILTERS)}>
            Clear
          </Button>
        ) : null}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-5"
      >
        <View className="justify-center pr-1">
          <Text variant="caption" tone="muted">
            Sort
          </Text>
        </View>
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={filters.sort === option.value ? "secondary" : "ghost"}
            onPress={() => set({ sort: option.value })}
          >
            {option.label}
          </Button>
        ))}
      </ScrollView>
    </View>
  );
}
