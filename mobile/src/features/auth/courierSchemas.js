import { z } from "zod";

export const VEHICLE_TYPES = [
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "car", label: "Car" },
];

export const courierAccountStep = z
  .object({
    name: z.string().trim().min(1, "Your name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phoneNumber: z.string().trim().min(6, "Phone number is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// vehicleType is the only field the backend insists on; the rest go onto the
// courier profile and are checked by a human during verification.
export const courierVehicleStep = z.object({
  vehicleType: z.enum(["bike", "scooter", "motorcycle", "car"], {
    message: "Pick what you deliver on",
  }),
  vehicleModel: z.string().trim().optional(),
  vehicleNumber: z.string().trim().optional(),
});
