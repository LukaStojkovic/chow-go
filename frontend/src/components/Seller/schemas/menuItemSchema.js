import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(1, "Dish name is required"),
  category: z.string().min(1, "Please select a category"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  available: z.boolean(),
  description: z.string().optional(),
  images: z
    .array(z.instanceof(File))
    .min(1, "At least one image is required")
    .max(6, "Maximum 6 images allowed")
    .optional()
    .default([]),
});
