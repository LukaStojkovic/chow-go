/**
 * Cuisine / category filter rail.
 *
 * Implemented as a radio group rather than a row of buttons: exactly one
 * category is active at a time, arrow keys move between options, and the
 * selected one is announced as checked. A row of `aria-pressed` buttons would
 * suggest they can be combined, which they cannot.
 */

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { hoverNudge } from "@/lib/motion";
import { CATEGORIES } from "@/lib/constants";
import { Rail } from "@/components/layout/primitives";

/**
 * @param {Object} props
 * @param {string} props.value Currently selected category value.
 * @param {(value: string) => void} props.onChange
 * @param {typeof CATEGORIES} [props.categories]
 */
export function CategoryRail({ value, onChange, categories = CATEGORIES }) {
  return (
    <Rail role="radiogroup" aria-label="Filter by category">
      {categories.map(({ id, label, value: categoryValue, icon: Icon }) => {
        const isActive = value === categoryValue;

        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            {...hoverNudge}
            aria-checked={isActive}
            // Only the selected option is in the tab order; arrow keys move
            // within the group, which is the expected radio-group behaviour.
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(categoryValue)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const index = categories.findIndex((c) => c.value === value);
              const delta = event.key === "ArrowRight" ? 1 : -1;
              const next = categories[(index + delta + categories.length) % categories.length];
              onChange(next.value);
            }}
            className={cn(
              "flex shrink-0 snap-start flex-col items-center gap-1.5",
              "rounded-sm px-1 py-1 outline-none",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <span
              className={cn(
                "relative flex size-14 items-center justify-center rounded-md border",
                "transition-colors duration-(--duration-standard) ease-(--ease-standard)",
                isActive
                  ? "border-primary bg-primary-subtle text-primary-subtle-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <span
              className={cn(
                "text-caption max-w-16 truncate",
                isActive ? "text-foreground font-semibold" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </motion.button>
        );
      })}
    </Rail>
  );
}
