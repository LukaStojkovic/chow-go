import { z } from "zod";

export const courierApplicationSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name must not exceed 50 characters"),

  email: z.string().email("Please enter a valid email address"),

  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .regex(/^[0-9+\-\s()]*$/, "Phone number contains invalid characters"),

  vehicleType: z.enum(["bike", "scooter", "motorcycle", "car"], {
    errorMap: () => ({ message: "Please select a valid vehicle type" }),
  }),

  vehicleNumber: z
    .string()
    .min(1, "Vehicle number is required")
    .max(20, "Vehicle number must not exceed 20 characters"),

  vehicleModel: z
    .string()
    .min(1, "Vehicle model is required")
    .max(30, "Vehicle model must not exceed 30 characters"),

  documents: z.object({
    driverLicense: z.object({
      number: z
        .string()
        .min(1, "Driver license number is required")
        .max(20, "Driver license number must not exceed 20 characters"),
      expiryDate: z
        .string()
        .refine(
          (date) => !date || new Date(date) > new Date(),
          "License must not be expired",
        ),
    }),

    vehicleRegistration: z.object({
      number: z
        .string()
        .min(1, "Vehicle registration number is required")
        .max(20, "Vehicle registration must not exceed 20 characters"),
      expiryDate: z
        .string()
        .refine(
          (date) => !date || new Date(date) > new Date(),
          "Registration must not be expired",
        ),
    }),

    insurance: z.object({
      number: z
        .string()
        .min(1, "Insurance number is required")
        .max(30, "Insurance number must not exceed 30 characters"),
      expiryDate: z
        .string()
        .refine(
          (date) => !date || new Date(date) > new Date(),
          "Insurance must not be expired",
        ),
    }),
  }),

  paymentMethod: z.enum(["cash"], {
    errorMap: () => ({ message: "Payment method is required" }),
  }),
});
