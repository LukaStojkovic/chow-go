import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, taught about our type scale.
 *
 * Our font sizes are named roles (`text-caption`, `text-h1`, `text-price`)
 * rather than t-shirt sizes. Stock tailwind-merge has no way to know that, so
 * it classifies them as *text colours* - and then `cn("text-caption", ...,
 * "text-foreground")`, which is exactly what the `<Text>` primitive does on
 * every render, resolves the "conflict" by dropping the size.
 *
 * The symptom is that nothing has a size: every label renders at the default
 * 14px with only its family and weight applied, so an `overline` reads as big
 * bold text instead of a small caption. Declaring the roles as font-size
 * classes is what makes the scale reach the screen at all.
 */
const FONT_SIZES = [
  "display",
  "h1",
  "h2",
  "h3",
  "label",
  "label-sm",
  "overline",
  "body-lg",
  "body",
  "body-sm",
  "caption",
  "price",
  "price-lg",
  "price-xl",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
});

export const cn = (...inputs) => twMerge(clsx(inputs));
