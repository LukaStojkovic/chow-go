/**
 * The two-family type system.
 *
 * Plus Jakarta Sans carries everything scanned at a glance: headings, prices,
 * labels. Inter carries everything read a sentence at a time.
 *
 * Weights stop at 700. An 800 display face reads as a poster, not as an
 * interface - emphasis here comes from size and whitespace instead.
 */
export const TEXT_VARIANTS = {
  // Plus Jakarta Sans
  display: "text-display font-jakarta-bold",
  h1: "text-h1 font-jakarta-bold",
  h2: "text-h2 font-jakarta-bold",
  h3: "text-h3 font-jakarta",
  label: "text-label font-jakarta",
  "label-sm": "text-label-sm font-jakarta",
  overline: "text-overline font-jakarta uppercase",

  // Inter
  "body-lg": "text-body-lg font-sans",
  body: "text-body font-sans",
  "body-sm": "text-body-sm font-sans",
  caption: "text-caption font-sans",

  // Numerals
  price: "text-price font-jakarta-bold",
  "price-lg": "text-price-lg font-jakarta-bold",
  "price-xl": "text-price-xl font-jakarta-bold",
};

export const TABULAR_VARIANTS = new Set(["price", "price-lg", "price-xl"]);
