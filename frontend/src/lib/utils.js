import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h1", "h2", "h3", "body-lg", "body", "body-sm", "label", "caption", "price", "price-lg"],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
