import { effectivePrice } from "../utils/promotion.js";
import { toMoney } from "../utils/money.js";

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

    const current = toMoney(effectivePrice(item.price, item.promotion, now));
    const basePrice = current < item.price ? toMoney(item.price) : undefined;

    if (toMoney(line.price) !== current) {
      changes.push({
        menuItem: String(item._id),
        name: item.name,
        from: toMoney(line.price),
        to: current,
      });
      line.price = current;
    }
    if (line.basePrice !== basePrice) line.basePrice = basePrice;
    if (line.name !== item.name) line.name = item.name;
  }

  return { changes, unavailable };
}
