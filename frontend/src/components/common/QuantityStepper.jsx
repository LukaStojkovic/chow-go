/**
 * Quantity control.
 *
 * Used in the customisation sheet, the basket panel and the checkout summary,
 * so the interaction is identical everywhere. The quantity is announced as a
 * live region because the number changing is the only feedback a screen-reader
 * user gets from pressing the buttons.
 */

import { Minus, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * @param {Object} props
 * @param {number} props.value
 * @param {(next: number) => void} props.onChange
 * @param {number} [props.min] Reaching `min` turns the decrement into a remove
 *   action when `onRemove` is provided.
 * @param {number} [props.max]
 * @param {string} props.itemName Used to build the accessible labels.
 * @param {() => void} [props.onRemove]
 * @param {boolean} [props.disabled]
 * @param {"sm"|"md"} [props.size]
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  itemName,
  onRemove,
  disabled = false,
  size = "md",
  className,
}) {
  const atMin = value <= min;
  const atMax = value >= max;
  const removeOnDecrement = atMin && typeof onRemove === "function";

  const handleDecrement = () => {
    if (removeOnDecrement) {
      onRemove();
      return;
    }
    if (!atMin) onChange(value - 1);
  };

  const buttonSize = size === "sm" ? "size-8" : "size-9";

  return (
    <div
      className={cn(
        "border-border bg-card inline-flex items-center gap-0.5 rounded-sm border p-0.5",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(buttonSize, removeOnDecrement && "text-destructive hover:bg-destructive-subtle")}
        onClick={handleDecrement}
        disabled={disabled || (atMin && !removeOnDecrement)}
        aria-label={
          removeOnDecrement ? `Remove ${itemName} from basket` : `Decrease quantity of ${itemName}`
        }
      >
        {removeOnDecrement ? (
          <Trash2 className="size-4" aria-hidden="true" />
        ) : (
          <Minus className="size-4" aria-hidden="true" />
        )}
      </Button>

      <output
        aria-live="polite"
        aria-label={`${itemName} quantity`}
        className={cn(
          "tabular text-foreground min-w-8 text-center font-semibold",
          size === "sm" ? "text-body-sm" : "text-body",
        )}
      >
        {value}
      </output>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={buttonSize}
        onClick={() => !atMax && onChange(value + 1)}
        disabled={disabled || atMax}
        aria-label={`Increase quantity of ${itemName}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
