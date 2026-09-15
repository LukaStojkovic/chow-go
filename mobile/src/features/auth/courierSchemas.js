import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";

// Values are the backend's enum and stay English; the label is looked up when
// the picker renders, so it follows the language the user is on.
export const VEHICLE_TYPES = ["bike", "scooter", "motorcycle", "car"];

export const courierAccountStep = z
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

// vehicleType is the only field the backend insists on; the rest go onto the
// courier profile and are checked by a human during verification.
export const courierVehicleStep = z.object({
  vehicleType: z.enum(["bike", "scooter", "motorcycle", "car"], {
    message: msg("validation:courier.vehicleTypeRequired"),
  }),
  vehicleModel: z.string().trim().optional(),
  vehicleNumber: z.string().trim().optional(),
});
