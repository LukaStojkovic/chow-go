// Inter ships no static 550 or 650 face and variable fonts are unreliable on
// Android, so the web's 550/650 roles collapse onto 600.
export const TEXT_VARIANTS = {
  display: "text-display font-bold",
  h1: "text-h1 font-bold",
  h2: "text-h2 font-semibold",
  h3: "text-h3 font-semibold",
  "body-lg": "text-body-lg font-sans",
  body: "text-body font-sans",
  "body-sm": "text-body-sm font-sans",
  label: "text-label font-medium",
  caption: "text-caption font-medium",
  price: "text-price font-semibold",
  "price-lg": "text-price-lg font-bold",
};

export const TABULAR_VARIANTS = new Set(["price", "price-lg"]);
