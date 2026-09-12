/**
 * Web-side taxonomy shim.
 *
 * Two jobs. It resolves the shared taxonomy's string icon keys to Lucide
 * components - the shared package cannot reference an icon library, because
 * the native client draws from a different one. And it wraps the shared
 * label builders in hooks, so a list of options is rebuilt when the language
 * changes rather than frozen at import time.
 *
 * The hooks memoise on `i18n.language` rather than on `t`: react-i18next hands
 * back a new `t` on other re-renders too, and rebuilding eleven category
 * objects on every keystroke in the search box is wasted work.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  addressLabels,
  addressTypes,
  categoryOptions,
  cuisineOptions as buildCuisineOptions,
  deliveryTimeFilters,
  deliveryTypes,
  paymentMethods,
  sortOptions,
  vehicleOptions,
} from "@chowgo/shared/constants";

export {
  MAX_SAVED_ADDRESSES,
  MAX_ORDER_NOTES,
  CATEGORY_VALUES,
  CUISINE_VALUES,
  cuisineLabel,
  addressLabelText,
  matchAddressLabelValue,
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

/**
 * Build a translated option list once per language.
 *
 * @template T
 * @param {(t: Function) => T} build
 * @param {(option: T) => T} [decorate]
 * @returns {T}
 */
function useTaxonomy(build, decorate) {
  const { t, i18n } = useTranslation("common");

  return useMemo(() => {
    const options = build(t);
    return decorate ? options.map(decorate) : options;
    // `t` is intentionally absent: `i18n.language` is what changes the output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);
}

/**
 * Discovery category rail.
 *
 * @returns {{ id: string, label: string, value: string, icon: import("lucide-react").LucideIcon }[]}
 */
export function useCategories() {
  return useTaxonomy(categoryOptions, (category) => ({
    ...category,
    icon: CATEGORY_ICONS[category.icon] ?? LayoutGrid,
  }));
}

/** @returns {{ value: string, label: string }[]} */
export function useCuisineOptions() {
  return useTaxonomy(buildCuisineOptions);
}

/** @returns {{ value: string, label: string }[]} */
export function useSortOptions() {
  return useTaxonomy(sortOptions);
}

/** @returns {{ value: string, label: string }[]} */
export function useDeliveryTimeFilters() {
  return useTaxonomy(deliveryTimeFilters);
}

/** @returns {{ value: string, label: string, description: string }[]} */
export function useDeliveryTypes() {
  return useTaxonomy(deliveryTypes);
}

/** @returns {{ value: string, label: string, description: string }[]} */
export function usePaymentMethods() {
  return useTaxonomy(paymentMethods);
}

/** @returns {{ value: string, label: string }[]} */
export function useVehicleOptions() {
  return useTaxonomy(vehicleOptions);
}

/**
 * @returns {{ value: string, label: string, icon: import("lucide-react").LucideIcon, fields: string[] }[]}
 */
export function useAddressTypes() {
  return useTaxonomy(addressTypes, (type) => ({
    ...type,
    icon: ADDRESS_TYPE_ICONS[type.icon] ?? MapPin,
  }));
}

/**
 * @returns {{ value: string, label: string, icon: import("lucide-react").LucideIcon }[]}
 */
export function useAddressLabels() {
  return useTaxonomy(addressLabels, (option) => ({
    ...option,
    icon: ADDRESS_LABEL_ICONS[option.icon] ?? MapPin,
  }));
}
