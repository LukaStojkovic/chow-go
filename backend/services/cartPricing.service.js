import { resolveOptionSelection } from "@chowgo/shared/menuOptions";
import { effectivePrice } from "../utils/promotion.js";
import { sumMoney, toMoney } from "../utils/money.js";

/** A cart line's id; lines saved before options existed are keyed by their dish. */
export const lineIdOf = (line) => line.lineId || String(line.menuItem?._id ?? line.menuItem);

/**
 * One portion's price: the dish at its promoted price plus its options. A
 * promotion discounts the dish, never the extras.
 */
export function linePricing(menuItem, optionsDelta = 0, now = new Date()) {
  const dish = toMoney(effectivePrice(menuItem.price, menuItem.promotion, now));
  const price = sumMoney(dish, optionsDelta);
  const basePrice = dish < menuItem.price ? sumMoney(menuItem.price, optionsDelta) : undefined;
  return { price, basePrice };
}

// Brings every line of a cart (with items.menuItem populated) to the price the
// menu charges right now. A basket filled during a one-hour 90%-off deal used
// to check out at that price weeks later, and a seller's price rise never
// reached a basket that already held the dish.
export function repriceCartLines(cart, now = new Date()) {
  const changes = [];
  const unavailable = [];

  for (const line of cart.items) {
    const item = line.menuItem;
    if (!item || typeof item !== "object" || !item.available) {
      unavailable.push(line.name);
      continue;
    }

    // An option the seller removed or sold out, or a new required group, makes
    // the line impossible to fulfil as chosen.
    const selection = resolveOptionSelection(
      item.optionGroups,
      (line.options ?? []).map((option) => option.optionId),
    );
    if (!selection.ok) {
      unavailable.push(line.name);
      continue;
    }

    const { price: current, basePrice } = linePricing(item, selection.priceDelta, now);

    if (toMoney(line.price) !== current) {
      changes.push({
        menuItem: String(item._id),
        lineId: lineIdOf(line),
        name: item.name,
        from: toMoney(line.price),
        to: current,
      });
      line.price = current;
    }
    if (line.basePrice !== basePrice) line.basePrice = basePrice;
    if (line.name !== item.name) line.name = item.name;
    if (selection.selections.length > 0) line.options = selection.selections;
  }

  return { changes, unavailable };
}
