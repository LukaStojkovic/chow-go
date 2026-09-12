import { useTranslation } from "react-i18next";
import { categoryOptions } from "@chowgo/shared/constants";
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
import { useMemo } from "react";

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
  const { t, i18n } = useTranslation("common");
  // Rebuilt only when the language changes: `t` is a new function on every
  // re-render, and this list is rendered inside a scrolling feed.
  const categories = useMemo(() => categoryOptions(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChipRow>
      {categories.map((category) => (
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
