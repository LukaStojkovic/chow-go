import { z } from "zod";

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email");
// Matches the backend's own floor in authController.register.
const password = z.string().min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email,
    phoneNumber: z.string().trim().min(6, "Phone number is required"),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const forgotPasswordSchema = z.object({ email });

export const otpSchema = z.object({
  code: z.string().trim().length(6, "Enter the 6-digit code"),
});

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
