import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import { dateKey, resolveTimeZone, startOfDateKey } from "../utils/zonedTime.js";
import { emitMenuStock } from "./orderSocket.service.js";
import { addDays } from "@chowgo/shared/dateKeys";
import { STOCK_UNTIL } from "@chowgo/shared/stock";
import { withPromotion } from "../utils/promotion.js";

const invalid = (field) => new AppError("errors:menuStock.invalid", 400, "STOCK_INVALID", { field }, { field });
const notFound = () => new AppError("Menu item not found", 404);

function soldOutUntilFor(until, timeZone, now) {
  if (until === undefined || until === null || until === "indefinite") return null;
  if (until === "endOfDay") return startOfDateKey(addDays(dateKey(now, timeZone), 1), timeZone);
  throw invalid("until");
}

/**
 * Marks a dish, or one of its options, in or out of stock in one conditional write.
 * Body: `{ available, until?: "endOfDay" | "indefinite", optionId? }`. Out of stock "until end of
 * day" comes back by itself at the restaurant's local midnight; back in stock clears the timer.
 */
export async function setStock({ restaurantId, menuItemId, input = {} }) {
  if (!mongoose.Types.ObjectId.isValid(menuItemId)) throw notFound();
  if (typeof input.available !== "boolean") throw invalid("available");
  if (input.until !== undefined && !STOCK_UNTIL.includes(input.until)) throw invalid("until");

  const restaurant = await Restaurant.findById(restaurantId).select("timezone").lean();
  const now = new Date();
  const until = input.available ? null : soldOutUntilFor(input.until, resolveTimeZone(restaurant?.timezone), now);
  const filter = { _id: menuItemId, restaurant: restaurantId, deletedAt: null };

  let updated;
  if (input.optionId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(input.optionId)) throw invalid("optionId");
    const optionId = new mongoose.Types.ObjectId(String(input.optionId));
    updated = await MenuItem.findOneAndUpdate(
      { ...filter, "optionGroups.options._id": optionId },
      {
        $set: {
          "optionGroups.$[].options.$[option].available": input.available,
          "optionGroups.$[].options.$[option].soldOutUntil": until,
        },
      },
      { new: true, arrayFilters: [{ "option._id": optionId }] },
    ).lean();
  } else {
    updated = await MenuItem.findOneAndUpdate(filter, { $set: { available: input.available, soldOutUntil: until } }, { new: true }).lean();
  }
  if (!updated) throw notFound();

  emitMenuStock(restaurantId, { menuItemId: String(updated._id), optionId: input.optionId ? String(input.optionId) : null });
  return withPromotion(updated);
}

/** Restocks every dish and option whose sold-out time has passed. Run by the per-minute cron. */
export async function restockDue(now = new Date()) {
  const due = { $lte: now };
  const [dishes, options] = await Promise.all([
    MenuItem.updateMany(
      { available: false, soldOutUntil: due, deletedAt: null },
      { $set: { available: true, soldOutUntil: null } },
    ),
    MenuItem.updateMany(
      { "optionGroups.options.soldOutUntil": due, deletedAt: null },
      {
        $set: {
          "optionGroups.$[].options.$[option].available": true,
          "optionGroups.$[].options.$[option].soldOutUntil": null,
        },
      },
      { arrayFilters: [{ "option.soldOutUntil": due }] },
    ),
  ]);
  return { dishes: dishes.modifiedCount, options: options.modifiedCount };
}
