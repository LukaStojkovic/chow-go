/**
 * Short relative timestamps ("2h ago"), for feeds where the exact moment does
 * not matter but the recency does.
 */

import { intlLocale } from "./i18n/config.js";
import { currentLocale, t } from "./i18n/index.js";

/**
 * @param {string | Date | null | undefined} value
 * @returns {string}
 */
export function formatDateAgo(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return t("order:ago.justNow");
  if (hours < 24) return t("order:ago.hours", { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 7) return t("order:ago.days", { count: days });

  return new Intl.DateTimeFormat(intlLocale(currentLocale()), {
    month: "short",
    day: "numeric",
  }).format(date);
}
