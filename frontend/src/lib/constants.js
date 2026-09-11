// Resolves the shared taxonomy's string icon keys to Lucide components.
import {
  Beef,
  Briefcase,
  Building,
  CakeSlice,
  CookingPot,
  Croissant,
  CupSoda,
  Fish,
  Flame,
  Heart,
  Home,
  Hotel,
  House,
  LayoutGrid,
  MapPin,
  Pizza,
  Salad,
  Soup,
} from "lucide-react";
import {
  ADDRESS_LABELS as ADDRESS_LABEL_DATA,
  ADDRESS_TYPES as ADDRESS_TYPE_DATA,
  CATEGORIES as CATEGORY_DATA,
} from "@chowgo/shared/constants";

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

/** @type {Record<string, import("lucide-react").LucideIcon>} */
const ADDRESS_TYPE_ICONS = {
  apartment: Building,
  house: House,
  office: Briefcase,
  hotel: Hotel,
  other: MapPin,
};

/** @type {Record<string, import("lucide-react").LucideIcon>} */
const ADDRESS_LABEL_ICONS = { home: Home, work: Briefcase, partner: Heart, other: MapPin };

export const ADDRESS_TYPES = ADDRESS_TYPE_DATA.map((type) => ({
  ...type,
  icon: ADDRESS_TYPE_ICONS[type.icon] ?? MapPin,
}));

export const ADDRESS_LABELS = ADDRESS_LABEL_DATA.map((option) => ({
  ...option,
  icon: ADDRESS_LABEL_ICONS[option.icon] ?? MapPin,
}));

/** Rows written before the label list existed carry "home" rather than "Home". */
export function matchAddressLabel(stored) {
  const found = ADDRESS_LABELS.find(
    (option) => option.value.toLowerCase() === String(stored ?? "").toLowerCase(),
  );
  return found?.value ?? "Other";
}
