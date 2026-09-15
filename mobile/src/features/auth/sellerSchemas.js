import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";

// Mirrors the eleven fields authController requires before it will keep the
// user it just created, split across the wizard's three steps.
export const accountStep = z
  .object({
    name: z.string().trim().min(1, msg("validation:auth.ownNameRequired")),
    email: z.string().trim().email(msg("validation:auth.emailInvalid")),
    phoneNumber: z.string().trim().min(6, msg("validation:auth.phoneRequired")),
    password: z.string().min(6, msg("validation:auth.passwordMin", { count: 6 })),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: msg("validation:auth.passwordsMismatch"),
  });

export const restaurantStep = z.object({
  restaurantName: z.string().trim().min(1, msg("validation:restaurant.nameRequired")),
  cuisineType: z.string().min(1, msg("validation:restaurant.cuisineRequired")),
  restaurantPhone: z.string().trim().min(6, msg("validation:restaurant.phoneRequired")),
  restaurantDescription: z.string().trim().min(1, msg("validation:restaurant.descriptionRequired")),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, msg("validation:restaurant.timeFormat")),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, msg("validation:restaurant.timeFormat")),
});

export const locationStep = z.object({
  restaurantAddress: z.string().trim().min(1, msg("validation:restaurant.addressRequired")),
  restaurantCity: z.string().trim().min(1, msg("validation:restaurant.cityRequired")),
  restaurantZipCode: z.string().trim().min(1, msg("validation:restaurant.zipRequired")),
  restaurantLat: z.string().min(1, msg("validation:restaurant.locationRequired")),
  restaurantLng: z.string().min(1, msg("validation:restaurant.locationRequired")),
});
