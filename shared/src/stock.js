/**
 * Out of stock, for a dish or one option of it. `available: false` hides it from customers; a
 * `soldOutUntil` brings it back on its own (the backend cron restocks it once the time passes),
 * and none means until the seller turns it back on.
 */

export const STOCK_UNTIL = ["endOfDay", "indefinite"];

/** Null while in stock, else `{ until: Date | null }`. */
export function soldOutState(entity, now = new Date()) {
  if (!entity || entity.available !== false) return null;
  const until = entity.soldOutUntil ? new Date(entity.soldOutUntil) : null;
  if (until && until <= now) return null;
  return { until };
}

export function isInStock(entity, now = new Date()) {
  return soldOutState(entity, now) === null;
}

/** How many options of a dish are switched off right now. */
export function soldOutOptionCount(item, now = new Date()) {
  return (item?.optionGroups ?? []).reduce(
    (sum, group) => sum + (group.options ?? []).filter((option) => !isInStock(option, now)).length,
    0,
  );
}
