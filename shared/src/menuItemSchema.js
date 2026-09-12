import { z } from "zod";


import { PROMOTION_LIMITS } from "./promotion.js";
import { msg } from "./i18n/fieldErrors.js";

/**
 * An image the client is uploading. A browser supplies a File; React Native
 * supplies { uri, name, type }. This package cannot reference either global, so
 * it accepts anything that could plausibly be appended to FormData.
 */
const uploadableImage = z.custom(
  (value) =>
    (typeof value === "object" && value !== null && typeof value.uri === "string") ||
    (typeof File !== "undefined" && value instanceof File),
  { message: msg("validation:menuItem.imageUnsupported") },
);

const priceField = z
  .string()
  .min(1, msg("validation:menuItem.priceRequired"))
  .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: msg("validation:menuItem.pricePositive"),
  });

/**
 * The promotion block.
 *
 * Every field is a string because it comes straight out of an `<input>` and
 * goes straight into multipart form data - coercing here and back again would
 * only give react-hook-form a second representation to keep in sync. The
 * numeric rules live in `checkPromotion`, which needs the dish's price and so
 * cannot run at field level.
 */
const promotionField = z.object({
  isActive: z.boolean().default(false),
  type: z.enum(["percentage", "fixed"]).default("percentage"),
  value: z.string().default(""),
  label: z
    .string()
    .max(
      PROMOTION_LIMITS.maxLabelLength,
      msg("validation:promotion.labelMax", { max: PROMOTION_LIMITS.maxLabelLength }),
    )
    .default(""),
  startsAt: z.string().default(""),
  endsAt: z.string().default(""),
});

/**
 * Cross-field validation for a promotion: it is only meaningful against the
 * price of the dish it is discounting, so it runs on the whole form rather
 * than on the promotion object alone.
 *
 * Mirrors `normalizePromotionInput` in `backend/utils/promotion.js`, which
 * re-checks all of this - this copy exists so the seller finds out before
 * submitting, not after.
 */
function checkPromotion(data, ctx) {
  const promotion = data.promotion;
  if (!promotion?.isActive) return;

  const reject = (path, message) =>
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["promotion", path],
      message,
    });

  const value = parseFloat(promotion.value);
  if (!promotion.value || Number.isNaN(value) || value <= 0) {
    return reject("value", msg("validation:promotion.valueRequired"));
  }

  if (promotion.type === "percentage" && value > PROMOTION_LIMITS.maxPercentOff) {
    return reject(
      "value",
      msg("validation:promotion.maxPercent", { max: PROMOTION_LIMITS.maxPercentOff }),
    );
  }

  const price = parseFloat(data.price);
  if (Number.isFinite(price) && price > 0) {
    const discounted =
      promotion.type === "fixed" ? price - value : price * (1 - value / 100);

    if (discounted < PROMOTION_LIMITS.minPrice) {
      return reject(
        "value",
        msg("validation:promotion.belowFloor", {
          min: PROMOTION_LIMITS.minPrice.toFixed(2),
        }),
      );
    }
  }

  if (
    promotion.startsAt &&
    promotion.endsAt &&
    new Date(promotion.endsAt) <= new Date(promotion.startsAt)
  ) {
    reject("endsAt", msg("validation:promotion.endsBeforeStart"));
  }
}

export const menuItemSchema = z
  .object({
    name: z.string().min(1, msg("validation:menuItem.nameRequired")),
    category: z.string().min(1, msg("validation:menuItem.categoryRequired")),
    price: priceField,
    available: z.boolean(),
    description: z.string().trim().min(1, msg("validation:menuItem.descriptionRequired")),
    images: z
      .array(uploadableImage)
      .min(1, msg("validation:menuItem.imagesRequired"))
      .max(6, msg("validation:menuItem.imagesMax", { count: 6 }))
      .default([]),
    promotion: promotionField.default({}),
  })
  .superRefine(checkPromotion);

export const editMenuItemSchema = z
  .object({
    name: z.string().min(1, msg("validation:menuItem.nameRequired")),
    category: z.string().min(1, msg("validation:menuItem.categoryRequired")),
    price: priceField,
    available: z.boolean(),
    description: z.string().trim().min(1, msg("validation:menuItem.descriptionRequired")),
    images: z
      .array(uploadableImage)
      .max(6, msg("validation:menuItem.imagesMax", { count: 6 }))
      .default([]),
    existingImages: z.array(z.string()).optional().default([]),
    promotion: promotionField.default({}),
  })
  .superRefine((data, ctx) => {
    if (data.images.length === 0 && data.existingImages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["images"],
        message: msg("validation:menuItem.imagesRequired"),
      });
    }
    checkPromotion(data, ctx);
  });

/** The empty promotion a new dish starts with. */

export const EMPTY_PROMOTION = {
  isActive: false,
  type: "percentage",
  value: "",
  label: "",
  startsAt: "",
  endsAt: "",
};

/**
 * Turn a saved MenuItem's promotion back into form values.
 *
 * `datetime-local` will not accept an ISO string with a timezone or seconds, so
 * stored dates are cut back to `YYYY-MM-DDTHH:mm` in local time - otherwise the
 * input silently renders empty and the seller's window looks like it was lost.
 *
 * @param {Object | null | undefined} promotion
 */
export function promotionToFormValues(promotion) {
  if (!promotion) return { ...EMPTY_PROMOTION };

  const toLocalInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  return {
    isActive: Boolean(promotion.isActive),
    type: promotion.type === "fixed" ? "fixed" : "percentage",
    value: promotion.value ? String(promotion.value) : "",
    label: promotion.label || "",
    startsAt: toLocalInput(promotion.startsAt),
    endsAt: toLocalInput(promotion.endsAt),
  };
}
