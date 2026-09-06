/**
 * One line in the basket.
 *
 * Two densities: `edit` in the basket panel where quantity is changeable, and
 * `summary` at checkout and on the confirmation screen where the order is
 * fixed and the row is read-only.
 */

import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { SmartImage } from "@/components/common/SmartImage";
import { Price } from "@/components/common/Meta";
import { formatPrice } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/badge";
import { QuantityStepper } from "@/components/common/QuantityStepper";

/**
 * @param {Object} props
 * @param {import("@chowgo/shared/adapters/types").BasketLineView} props.line
 * @param {"edit"|"summary"} [props.mode]
 * @param {(quantity: number) => void} [props.onQuantityChange]
 * @param {() => void} [props.onRemove]
 * @param {boolean} [props.disabled]
 */
export function BasketLine({ line, mode = "edit", onQuantityChange, onRemove, disabled }) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      // Collapsing the height on exit is what makes the lines below close the
      // gap rather than jump up into it.
      exit={{ opacity: 0, height: 0, transition: transitions.standard }}
      transition={transitions.panel}
      className="flex gap-3 overflow-hidden py-3"
    >
      <SmartImage
        src={line.image}
        alt=""
        ratio="square"
        fallbackIcon={UtensilsCrossed}
        className="size-16 shrink-0 rounded-sm sm:size-[4.5rem]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-label text-foreground min-w-0 flex-1 leading-snug">
            {mode === "summary" && (
              <span className="text-muted-foreground tabular mr-1.5">{line.quantity}&times;</span>
            )}
            {line.name}
          </p>
          <Price value={line.lineTotal} size="sm" />
        </div>

        {line.savings > 0 && (
          <p className="text-body-sm inline-flex items-center gap-2">
            <Badge variant="promo" size="sm">
              Deal
            </Badge>
            <span className="text-primary tabular font-semibold">
              You save {formatPrice(line.savings)}
            </span>
            <span className="text-muted-foreground tabular line-through">
              <span className="sr-only">, was </span>
              {formatPrice(line.baseUnitPrice * line.quantity)}
            </span>
          </p>
        )}

        {line.description && (
          <p className="text-body-sm text-muted-foreground line-clamp-1">{line.description}</p>
        )}

        {line.notes && (
          <p className="text-caption text-muted-foreground line-clamp-2 italic">
            <span className="sr-only">Special instructions: </span>
            {line.notes}
          </p>
        )}

        {mode === "edit" && (
          <div className={cn("mt-1 flex items-center justify-between gap-3")}>
            <QuantityStepper
              size="sm"
              value={line.quantity}
              itemName={line.name}
              onChange={onQuantityChange}
              onRemove={onRemove}
              disabled={disabled}
            />
            {line.quantity > 1 && (
              <span className="text-caption text-muted-foreground tabular">
                <Price value={line.unitPrice} size="sm" muted className="font-normal" /> each
              </span>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
