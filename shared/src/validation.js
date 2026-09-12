/**
 * Courier application schema.
 *
 * Messages are translation keys rather than sentences - see
 * `i18n/fieldErrors.js` for why a schema built at module scope cannot hold
 * resolved copy. Render them with `translateFieldError(errors.field, t)`.
 */

import { z } from "zod";

import { msg } from "./i18n/fieldErrors.js";

export const courierApplicationSchema = z.object({
  fullName: z
    .string()
    .min(3, msg("validation:auth.fullNameMin", { count: 3 }))
    .max(50, msg("validation:auth.fullNameMax", { count: 50 })),

  email: z.string().email(msg("validation:auth.emailInvalid")),

  phoneNumber: z
    .string()
    .min(10, msg("validation:auth.phoneMin", { count: 10 }))
    .max(15, msg("validation:auth.phoneMax", { count: 15 }))
    .regex(/^[0-9+\-\s()]*$/, msg("validation:auth.phoneInvalid")),

  password: z
    .string()
    .min(8, msg("validation:auth.passwordMin", { count: 8 }))
    .max(50, msg("validation:auth.passwordMax", { count: 50 })),

  vehicleType: z.enum(["bike", "scooter", "motorcycle", "car"], {
    errorMap: () => ({ message: msg("validation:courier.vehicleTypeRequired") }),
  }),

  vehicleNumber: z
    .string()
    .min(1, msg("validation:courier.vehicleNumberRequired"))
    .max(20, msg("validation:courier.vehicleNumberMax", { count: 20 })),

  vehicleModel: z
    .string()
    .min(1, msg("validation:courier.vehicleModelRequired"))
    .max(30, msg("validation:courier.vehicleModelMax", { count: 30 })),

  documents: z.object({
    driverLicense: z.object({
      number: z
        .string()
        .min(1, msg("validation:courier.licenseNumberRequired"))
        .max(20, msg("validation:courier.licenseNumberMax", { count: 20 })),
      expiryDate: z
        .string()
        .refine(
          (date) => !date || new Date(date) > new Date(),
          msg("validation:courier.licenseNotExpired"),
        ),
    }),

    vehicleRegistration: z.object({
      number: z
        .string()
        .min(1, msg("validation:courier.registrationNumberRequired"))
        .max(20, msg("validation:courier.registrationNumberMax", { count: 20 })),
      expiryDate: z
        .string()
        .refine(
          (date) => !date || new Date(date) > new Date(),
          msg("validation:courier.registrationNotExpired"),
        ),
    }),

    insurance: z.object({
      number: z
        .string()
        .min(1, msg("validation:courier.insuranceNumberRequired"))
        .max(30, msg("validation:courier.insuranceNumberMax", { count: 30 })),
      expiryDate: z
        .string()
        .refine(
          (date) => !date || new Date(date) > new Date(),
          msg("validation:courier.insuranceNotExpired"),
        ),
    }),
  }),

  paymentMethod: z.enum(["cash"], {
    errorMap: () => ({ message: msg("validation:courier.paymentMethodRequired") }),
  }),
});
