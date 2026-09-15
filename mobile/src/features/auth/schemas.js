import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";

const email = z.string().trim().min(1, msg("validation:auth.emailRequired")).email(msg("validation:auth.emailInvalid"));
// Matches the backend's own floor in authController.register.
const password = z.string().min(8, msg("validation:auth.passwordMin", { count: 8 }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, msg("validation:auth.passwordRequired")),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, msg("validation:auth.nameRequired")),
    email,
    phoneNumber: z.string().trim().min(6, msg("validation:auth.phoneRequired")),
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: msg("validation:auth.passwordsMismatch"),
  });

export const forgotPasswordSchema = z.object({ email });

export const otpSchema = z.object({
  code: z.string().trim().length(6, msg("validation:auth.codeLength", { count: 6 })),
});

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: msg("validation:auth.passwordsMismatch"),
  });
