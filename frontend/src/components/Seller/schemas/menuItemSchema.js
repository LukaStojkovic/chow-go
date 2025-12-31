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
    .default([]),
});

export const editMenuItemSchema = z
  .object({
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
      .max(6, "Maximum 6 images allowed")
      .default([]),
    existingImages: z.array(z.string()).optional().default([]),
  })
  .refine((data) => data.images.length > 0 || data.existingImages.length > 0, {
    message: "At least one image is required",
    path: ["images"],
  });
