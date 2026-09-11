/**
 * The mobile palette. Single source of truth.
 *
 * `npm run sync-theme` reads this file and regenerates global.css and
 * src/theme/tokens.js from it - edit here, never there.
 *
 * Values are hex, or `rgb(r g b / a)` when a token is deliberately translucent.
 *
 * The character of the palette:
 *
 *   Neutral, not tinted. Surfaces are plain warm-neutral greys. An earlier
 *   version cast every surface blue, which fought the food photography and made
 *   the whole app look faintly cold; the photographs are the only saturated
 *   thing on a screen now.
 *
 *   One accent. Green marks the thing you are meant to press and the state you
 *   are meant to trust, and appears almost nowhere else. Orange exists solely
 *   for a price that has been marked down.
 *
 *   Contrast comes from type, not colour. Headings are near-black on white;
 *   secondary information is grey. Nothing is coloured merely to decorate it.
 */

export const light = {
  /* Surfaces. The gap between canvas and card is small on purpose - most
     content sits directly on the canvas with no card at all. */
  background: "#f6f6f7",
  foreground: "#16161a",
  card: "#ffffff",
  "card-foreground": "#16161a",
  popover: "#ffffff",
  "popover-foreground": "#16161a",

  /* The single accent.
     `primary` is the text-safe weight (4.6:1 on white) used for any fill that
     carries a label. `primary-bright` is the vivid one - live pulses, chart
     bars, anything graphic with no text on top. */
  primary: "#00874f",
  "primary-foreground": "#ffffff",
  "primary-hover": "#00713f",
  "primary-bright": "#00a862",
  "primary-subtle": "#e7f4ed",
  "primary-subtle-foreground": "#00593a",

  /* Reserved for a marked-down price and nothing else. */
  tertiary: "#e04a17",
  "tertiary-foreground": "#ffffff",
  "tertiary-subtle": "#fdefe9",
  "tertiary-subtle-foreground": "#9c3009",

  /* Neutrals. `secondary` fills inactive controls, `muted` fills inset panels,
     `accent` is the pressed surface. */
  secondary: "#f0f0f2",
  "secondary-foreground": "#2b2b31",
  muted: "#f3f3f5",
  "muted-foreground": "#77777f",
  accent: "#eaeaee",
  "accent-foreground": "#2b2b31",

  /* Status. `success` is the brand green by design - a delivered order and a
     primary action are the same colour in this system. */
  destructive: "#d92d20",
  "destructive-foreground": "#ffffff",
  "destructive-subtle": "#fdeceb",
  success: "#00874f",
  "success-foreground": "#ffffff",
  "success-subtle": "#e7f4ed",
  warning: "#a35b00",
  "warning-foreground": "#ffffff",
  "warning-subtle": "#fdf2e3",
  info: "#2f5fd8",
  "info-foreground": "#ffffff",
  "info-subtle": "#ecf0fd",

  /* Rating stars only - amber reads as a star, the accessible `warning` brown
     does not, and a star is a shape so it needs no contrast ratio of its own. */
  rating: "#f2a93b",

  /* Text sitting directly on a photograph. Fixed in both themes: a scrim is
     always dark and the text on it is always white. */
  "scrim-foreground": "#ffffff",
  "scrim-foreground-muted": "rgb(255 255 255 / 0.78)",

  border: "#e8e8ec",
  "border-strong": "#d6d6dc",
  input: "#e8e8ec",
  ring: "#00874f",

  /* Charts. A green ramp so a bar series reads as one quantity, with the
     orange and blue held back for a second and third series. */
  "chart-1": "#00a862",
  "chart-2": "#67d3a0",
  "chart-3": "#c5ead8",
  "chart-4": "#e04a17",
  "chart-5": "#2f5fd8",
};

/* Neutral near-black rather than a tinted navy, for the same reason the light
   theme is untinted. The green brightens so it still reads as the action colour
   against #0e0e11, and carries near-black label text rather than white. */
export const dark = {
  background: "#0e0e11",
  foreground: "#f2f2f5",
  card: "#1a1a1f",
  "card-foreground": "#f2f2f5",
  popover: "#232329",
  "popover-foreground": "#f2f2f5",

  primary: "#00c46e",
  "primary-foreground": "#04140b",
  "primary-hover": "#1ad884",
  "primary-bright": "#2ee089",
  "primary-subtle": "#10281c",
  "primary-subtle-foreground": "#5fe0a0",

  tertiary: "#ff7a4d",
  "tertiary-foreground": "#2a0c00",
  "tertiary-subtle": "#301509",
  "tertiary-subtle-foreground": "#ffab8b",

  secondary: "#22222a",
  "secondary-foreground": "#d3d3da",
  muted: "#1f1f25",
  "muted-foreground": "#9a9aa4",
  accent: "#2b2b34",
  "accent-foreground": "#f2f2f5",

  destructive: "#f97066",
  "destructive-foreground": "#250d0b",
  "destructive-subtle": "#2f1817",
  success: "#2ee089",
  "success-foreground": "#04140b",
  "success-subtle": "#10281c",
  warning: "#f0b04a",
  "warning-foreground": "#221701",
  "warning-subtle": "#2c2213",
  info: "#7ba1f5",
  "info-foreground": "#05122b",
  "info-subtle": "#1a2238",

  rating: "#f0b04a",

  "scrim-foreground": "#ffffff",
  "scrim-foreground-muted": "rgb(255 255 255 / 0.78)",

  border: "#26262d",
  "border-strong": "#3a3a44",
  input: "#26262d",
  ring: "#00c46e",

  "chart-1": "#00c46e",
  "chart-2": "#4bc98d",
  "chart-3": "#2a4b3b",
  "chart-4": "#ff7a4d",
  "chart-5": "#7ba1f5",
};
