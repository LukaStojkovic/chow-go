import { t } from "@chowgo/shared/i18n";

/**
 * Short status wording, for places that have room for a pill and nothing more.
 *
 * `@chowgo/shared`'s `ORDER_STATUS[...].label` is written to be read aloud and
 * to stand alone in a sentence - "Courier on the way to the restaurant" is
 * correct there and unusable in a 90-point badge. These are the same states
 * said in two or three words.
 *
 * The full label still belongs anywhere with a line to itself: the tracking
 * screen headline, a screen-reader announcement, a notification.
 */
export function shortStatus(order) {
  const status = order?.status;
  if (!status) return order?.statusLabel ?? "";

  // Resolved on every call rather than held in a table: this module is
  // imported before a language exists, and the badge has to follow a switch.
  return t(`order:short.${status}`, { defaultValue: order?.statusLabel ?? "" });
}

/** The adapter's status tones, mapped onto the Badge component's vocabulary. */
export const STATUS_BADGE_TONE = {
  warning: "warning",
  info: "info",
  primary: "mint",
  success: "mint",
  destructive: "danger",
};
