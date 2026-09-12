import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/store/useAuthStore";

const forgotEmailSchema = z.object({
  email: z.string().email(msg("validation:auth.emailInvalid")),
});

const otpSchema = z.object({
  code: z.string().length(6, msg("validation:auth.codeLength", { count: 6 })),
});

const resetSchema = z
  .object({
    password: z.string().min(8, msg("validation:auth.passwordMin", { count: 8 })),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: msg("validation:auth.passwordsMismatch"),
    path: ["confirmPassword"],
  });

export function usePasswordReset(onComplete) {
  const { forgotPassword, verifyOtp, resetPassword } = useAuthStore();
  const [resetEmail, setResetEmail] = useState("");
  // verify-otp hands back a single-use, 15-minute token that reset-password
  // identifies the account by. It is held in memory only - persisting it would
  // leave a password-reset credential in storage.
  const [resetToken, setResetToken] = useState("");

  const emailForm = useForm({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const sendCode = async (data) => {
    try {
      const res = await forgotPassword(data.email);
      toast.success(res.message);
      setResetEmail(data.email);
      return "otp";
    } catch (err) {
      toast.error(apiErrorMessage(err, { fallbackKey: "auth:reset.sendFailed" }));
      return null;
    }
  };

  const verifyCode = async (data) => {
    try {
      const res = await verifyOtp(resetEmail, data.code);
      setResetToken(res?.data?.resetToken ?? "");
      toast.success(res.message);
      return "reset";
    } catch (err) {
      toast.error(apiErrorMessage(err, { fallbackKey: "auth:reset.verifyFailed" }));
      return null;
    }
  };

  const changePassword = async (data) => {
    try {
      const res = await resetPassword(resetToken, data.password);
      toast.success(res.message);
      emailForm.reset();
      otpForm.reset();
      resetForm.reset();
      setResetEmail("");
      setResetToken("");
      onComplete?.();
      return "login";
    } catch (err) {
      toast.error(apiErrorMessage(err, { fallbackKey: "auth:reset.resetFailed" }));
      return null;
    }
  };

  return {
    emailForm,
    otpForm,
    resetForm,
    resetEmail,
    sendCode,
    verifyCode,
    changePassword,
  };
}
