import { CATEGORIES } from "@chowgo/shared/constants";
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
import { Chip, ChipRow } from "@/components/ui/Chip";

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
  return (
    <ChipRow>
      {CATEGORIES.map((category) => (
        <Chip
          key={category.id}
          label={category.label}
          icon={ICONS[category.icon] ?? LayoutGrid}
          active={value === category.value}
          showCheck
          onPress={() => onChange(category.value)}
        />
      ))}
    </ChipRow>
  );
}
