import { ScrollView, Pressable } from "react-native";
import { CATEGORIES } from "@chowgo/shared/constants";
import * as Haptics from "expo-haptics";
import {
  Beef,
  CakeSlice,
  CookingPot,
  Croissant,
  CupSoda,
  Fish,
  Flame,
  LayoutGrid,
  Pizza,
  Salad,
  Soup,
} from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

// The shared taxonomy stores icons as string keys so the same data drives the
// web; this is the native half of that map.
const ICONS = {
  all: LayoutGrid,
  pizza: Pizza,
  burgers: Beef,
  pasta: CookingPot,
  salads: Salad,
  grill: Flame,
  sushi: Fish,
  soups: Soup,
  breakfast: Croissant,
  desserts: CakeSlice,
  drinks: CupSoda,
};

export function CategoryRail({ value, onChange }) {
  const { color } = useTokens();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5"
    >
      {CATEGORIES.map((category) => {
        const Icon = ICONS[category.icon] ?? LayoutGrid;
        const active = value === category.value;

        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(category.value);
            }}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-3.5 py-2",
              active ? "border-primary bg-primary" : "border-border bg-card",
            )}
          >
            <Icon
              size={16}
              color={active ? color["primary-foreground"] : color["muted-foreground"]}
            />
            <Text
              variant="label"
              className={active ? "text-primary-foreground" : "text-foreground"}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
