// Resolves the shared taxonomy's string icon keys to Lucide components.
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
} from "lucide-react";
import { CATEGORIES as CATEGORY_DATA } from "@chowgo/shared/constants";

export {
  CUISINE_LABELS,
  cuisineOptions,
  SORT_OPTIONS,
  DELIVERY_TIME_FILTERS,
  DELIVERY_TYPES,
  PAYMENT_METHODS,
  MAX_SAVED_ADDRESSES,
  MAX_ORDER_NOTES,
} from "@chowgo/shared/constants";

/** @type {Record<string, import("lucide-react").LucideIcon>} */
const CATEGORY_ICONS = {
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

/** @type {{ id: string, label: string, value: string, icon: import("lucide-react").LucideIcon }[]} */
export const CATEGORIES = CATEGORY_DATA.map((category) => ({
  ...category,
  icon: CATEGORY_ICONS[category.icon] ?? LayoutGrid,
}));
