import { z } from "zod";

// Mirrors the eleven fields authController requires before it will keep the
// user it just created, split across the wizard's three steps.
export const accountStep = z
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

export const restaurantStep = z.object({
  restaurantName: z.string().trim().min(1, "Restaurant name is required"),
  cuisineType: z.string().min(1, "Pick a cuisine"),
  restaurantPhone: z.string().trim().min(6, "Restaurant phone is required"),
  restaurantDescription: z.string().trim().min(1, "Tell customers what you serve"),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
});

export const locationStep = z.object({
  restaurantAddress: z.string().trim().min(1, "Street address is required"),
  restaurantCity: z.string().trim().min(1, "City is required"),
  restaurantZipCode: z.string().trim().min(1, "Postcode is required"),
  restaurantLat: z.string().min(1, "Set your location on the map"),
  restaurantLng: z.string().min(1, "Set your location on the map"),
});
