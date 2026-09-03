/**
 * Basket entry point in the header.
 *
 * The count is part of the accessible name rather than a bare number in a
 * corner, so "Basket, 3 items" is what gets announced. Empty is a state worth
 * showing - the button stays visible but drops its badge.
 */

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import useCartStore from "@/store/useCartStore";

/**
 * @param {Object} props
 * @param {() => void} props.onOpen
 * @param {boolean} [props.showLabel] Desktop headers show the word "Basket".
 */
export function BasketButton({ onOpen, showLabel = false, className }) {
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, line) => sum + (line.quantity || 0), 0);

  return (
    <Button
      type="button"
      variant={showLabel ? "outline" : "ghost"}
      size={showLabel ? "md" : "icon"}
      onClick={onOpen}
      className={cn("relative", className)}
      aria-label={count > 0 ? `Basket, ${count} ${count === 1 ? "item" : "items"}` : "Basket, empty"}
    >
      <ShoppingBag aria-hidden="true" />
      {showLabel && <span aria-hidden="true">Basket</span>}

      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transitions.micro}
          aria-hidden="true"
          className={cn(
            "bg-primary text-primary-foreground tabular",
            "absolute flex min-w-5 items-center justify-center rounded-full px-1.5",
            "text-[0.6875rem] leading-5 font-bold",
            showLabel ? "-top-2 -right-2" : "top-1 right-1",
          )}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </Button>
  );
}
