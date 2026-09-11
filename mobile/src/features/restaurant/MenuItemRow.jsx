import { DishRow } from "@/components/discovery/DishCard";

/**
 * A dish inside a restaurant's own menu.
 *
 * The same row the discovery feed uses, so a dish looks identical wherever you
 * meet it. The only difference here is the promo label: on a restaurant page
 * the deal is worth calling out as a tag, because everything around it is from
 * the same kitchen and the marked-down one should stand out.
 */
export function MenuItemRow({ dish, onPress, onAdd }) {
  return (
    <DishRow
      dish={dish}
      onPress={onPress}
      onAdd={onAdd}
      tag={dish.promoLabel ?? (dish.discountPercent > 0 ? `${dish.discountPercent}% off` : null)}
      className="mx-5"
    />
  );
}
