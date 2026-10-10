import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, UtensilsCrossed } from "lucide-react";

import { toUpsellViews } from "@chowgo/shared/adapters/menu";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/useCartStore";
import { useCartSuggestions } from "@/hooks/Cart/useCartSuggestions";
import { Rail } from "@/components/layout/primitives";
import { SmartImage } from "@/components/common/SmartImage";
import { PromoPrice } from "@/components/common/Meta";
import { Button } from "@/components/ui/button";
import { ItemCustomizationSheet } from "./ItemCustomizationSheet";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").BasketLineView[]} props.lines
 * @param {string} [props.className]
 */
export function UpsellRail({ lines, className }) {
  const { t } = useTranslation("basket");
  const addItem = useCartStore((state) => state.addItem);
  const raw = useCartSuggestions(lines);
  const [selectedDish, setSelectedDish] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const titleId = useId();

  const inBasket = new Set(lines.map((line) => line.menuItemId));
  const suggestions = toUpsellViews(raw).filter((dish) => !inBasket.has(dish.id));

  const handleAdd = async (dish) => {
    if (dish.hasOptions) {
      setSelectedDish(dish);
      return;
    }
    setAddingId(dish.id);
    const added = await addItem(dish.id, 1);
    setAddingId(null);
    if (added) toast.success(t("basket:upsell.added", { name: dish.name }));
  };

  return (
    <>
      {suggestions.length > 0 && (
        <section aria-labelledby={titleId} className={cn("space-y-2", className)}>
          <h3 id={titleId} className="text-label text-foreground">
            {t("basket:upsell.title")}
          </h3>
          <Rail bleed={false}>
            {suggestions.map((dish) => (
              <UpsellCard
                key={dish.id}
                dish={dish}
                isAdding={addingId === dish.id}
                onAdd={() => handleAdd(dish)}
              />
            ))}
          </Rail>
        </section>
      )}

      <ItemCustomizationSheet dish={selectedDish} onClose={() => setSelectedDish(null)} />
    </>
  );
}

function UpsellCard({ dish, isAdding, onAdd }) {
  const { t } = useTranslation(["basket", "restaurant"]);

  return (
    <article className="bg-card border-border flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-md border">
      <SmartImage
        src={dish.image}
        alt=""
        ratio="square"
        width={144}
        fallbackIcon={UtensilsCrossed}
      >
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute right-1.5 bottom-1.5 rounded-full shadow-md"
          aria-label={
            dish.hasOptions
              ? t("basket:upsell.choose", { name: dish.name })
              : t("basket:upsell.add", { name: dish.name })
          }
          isLoading={isAdding}
          loadingLabel={t("restaurant:reorder.adding")}
          onClick={onAdd}
        >
          <Plus aria-hidden="true" />
        </Button>
      </SmartImage>

      <div className="flex flex-1 flex-col gap-0.5 p-2">
        {dish.reasonLabel && (
          <p className="text-caption text-muted-foreground truncate">{dish.reasonLabel}</p>
        )}
        <h4 className="text-body-sm text-foreground line-clamp-2 font-medium">{dish.name}</h4>
        <PromoPrice
          price={dish.price}
          basePrice={dish.basePrice}
          currency={dish.currency}
          size="sm"
          className="mt-auto flex-wrap pt-1"
        />
      </div>
    </article>
  );
}
