/**
 * Add a dish to the basket: its options, a quantity, and a note for the
 * kitchen, carried through to `Order.items.specialInstructions` on checkout.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UtensilsCrossed } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { lineTotal as priceTimes, sumMoney } from "@chowgo/shared/money";
import { resolveOptionSelection } from "@chowgo/shared/menuOptions";
import useCartStore from "@/store/useCartStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SmartImage } from "@/components/common/SmartImage";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { SoldOutBadge } from "@/components/common/StatusBadges";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { ReplaceBasketDialog } from "./ReplaceBasketDialog";
import { DishOptionGroups } from "./DishOptionGroups";

const MAX_NOTE = 200;

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").DishView | null} props.dish
 *   `null` closes the sheet. Passing the dish itself as the open signal keeps
 *   the sheet stateless between openings.
 * @param {() => void} props.onClose
 * @param {string | null} [props.unavailableReason] Set when the restaurant is
 *   closed - the dish is fine, the kitchen is not.
 */
export function ItemCustomizationSheet({ dish, onClose, unavailableReason }) {
  // Remounted per dish by the key below, so quantity and notes reset without
  // an effect - and without a frame where the previous dish's values are
  // visible against the new dish's name.
  if (!dish) return null;

  return (
    <CustomizationForm
      key={dish.id}
      dish={dish}
      onClose={onClose}
      unavailableReason={unavailableReason}
    />
  );
}

function CustomizationForm({ dish, onClose, unavailableReason }) {
  const { t } = useTranslation(["basket", "restaurant", "common"]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selected, setSelected] = useState({});

  const { addItem, pendingConflict, resolveConflictByReplacing, dismissConflict, restaurant } =
    useCartStore();

  const groups = dish.optionGroups ?? [];
  const pickedIds = groups.flatMap((group) => selected[group.id] ?? []);
  const resolution = resolveOptionSelection(groups, pickedIds);
  const optionsDelta = sumMoney(
    ...groups.flatMap((group) =>
      group.options.filter((option) => pickedIds.includes(option.id)).map((option) => option.priceDelta),
    ),
  );
  const unitPrice = sumMoney(dish.price, optionsDelta);
  const baseUnitPrice = dish.basePrice ? sumMoney(dish.basePrice, optionsDelta) : null;

  const canOrder = dish.isAvailable && !unavailableReason;
  const lineTotal = priceTimes(unitPrice, quantity);
  const selectionHint = !resolution.ok ? selectionMessage(t, resolution) : null;

  const handleAdd = async () => {
    if (!resolution.ok) return;
    setIsAdding(true);
    const added = await addItem(dish.id, quantity, note.trim() || undefined, pickedIds);
    setIsAdding(false);
    // A cross-restaurant conflict leaves the sheet open behind the confirm
    // dialog, so the choice is not lost if the customer keeps their basket.
    if (added) onClose();
  };

  return (
    <>
      <ResponsiveSheet
        open={Boolean(dish)}
        onOpenChange={(next) => !next && onClose()}
        title={dish.name}
        hideHeader
        footer={
          <div className="space-y-2">
            {canOrder && selectionHint && (
              <p
                id="dish-options-hint"
                aria-live="polite"
                className="text-body-sm text-warning text-center"
              >
                {selectionHint}
              </p>
            )}
            <div className="flex items-center gap-3">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                itemName={dish.name}
                disabled={!canOrder}
              />
              <Button
                size="lg"
                className="flex-1"
                disabled={!canOrder || !resolution.ok}
                aria-describedby={canOrder && selectionHint ? "dish-options-hint" : undefined}
                isLoading={isAdding}
                loadingLabel={t("restaurant:reorder.adding")}
                onClick={handleAdd}
              >
                <span>{t("restaurant:menu.addToBasket")}</span>
                <span className="tabular ml-auto">
                  {formatPrice(lineTotal, { currency: dish.currency })}
                </span>
              </Button>
            </div>
          </div>
        }
      >
        <SmartImage
          src={dish.image}
          alt={dish.name}
          ratio="card"
          width={640}
          fallbackIcon={UtensilsCrossed}
          loading="eager"
        />

        <div className="space-y-4 p-4 sm:p-5">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-h1 min-w-0 flex-1">{dish.name}</h2>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-price-lg tabular">
                  {formatPrice(unitPrice, { currency: dish.currency })}
                </span>
                {baseUnitPrice && (
                  <span className="text-body-sm text-muted-foreground tabular line-through">
                    <span className="sr-only">{t("common:meta.reducedFrom")} </span>
                    {formatPrice(baseUnitPrice, { currency: dish.currency })}
                  </span>
                )}
              </span>
            </div>

            {dish.restaurantName && (
              <p className="text-body-sm text-muted-foreground">{dish.restaurantName}</p>
            )}

            {dish.description && (
              <p className="text-body text-muted-foreground pt-1">{dish.description}</p>
            )}
          </div>

          {!dish.isAvailable && (
            <div
              role="status"
              className="border-border bg-muted flex items-center gap-2 rounded-md border p-3"
            >
              <SoldOutBadge />
              <p className="text-body-sm text-muted-foreground">
                {t("basket:soldOutBody")}
              </p>
            </div>
          )}

          {dish.isAvailable && unavailableReason && (
            <p
              role="status"
              className="border-border bg-muted text-body-sm text-muted-foreground rounded-md border p-3"
            >
              {unavailableReason}
            </p>
          )}

          {groups.length > 0 && (
            <DishOptionGroups
              groups={groups}
              selected={selected}
              onChange={(groupId, ids) => setSelected((prev) => ({ ...prev, [groupId]: ids }))}
              currency={dish.currency}
              disabled={!canOrder}
              invalidGroup={resolution.ok ? null : resolution.group}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="dish-note">{t("basket:kitchenNote")}</Label>
            <Textarea
              id="dish-note"
              rows={3}
              value={note}
              maxLength={MAX_NOTE}
              disabled={!canOrder}
              placeholder={t("kitchenNotePlaceholder")}
              onChange={(event) => setNote(event.target.value)}
              aria-describedby="dish-note-hint"
            />
            <p id="dish-note-hint" className="text-caption text-muted-foreground">
              {t("line.instructionsHint")} {note.length}/{MAX_NOTE}
            </p>
          </div>
        </div>
      </ResponsiveSheet>

      <ReplaceBasketDialog
        open={Boolean(pendingConflict)}
        currentRestaurantName={restaurant?.name}
        nextRestaurantName={dish.restaurantName}
        onConfirm={async () => {
          const added = await resolveConflictByReplacing();
          if (added) onClose();
        }}
        onCancel={dismissConflict}
      />
    </>
  );
}

function selectionMessage(t, resolution) {
  if (resolution.code === "OPTION_REQUIRED") {
    return t("restaurant:options.pickRequired", { group: resolution.group });
  }
  if (resolution.code === "OPTION_TOO_MANY") {
    return t("restaurant:options.pickAtMost", { group: resolution.group, max: resolution.max });
  }
  return t(`errors:byCode.${resolution.code}`, {
    defaultValue: t("errors:byCode.OPTION_UNKNOWN"),
  });
}
