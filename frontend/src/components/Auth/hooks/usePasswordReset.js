import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

const forgotEmailSchema = z.object({
  email: z.string().email("Invalid email"),
});

const otpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function usePasswordReset(onComplete) {
  const { forgotPassword, verifyOtp, resetPassword } = useAuthStore();
  const [resetEmail, setResetEmail] = useState("");

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
      toast.error(err.response?.data?.message || "Failed to send code");
      return null;
    }
  };

  const verifyCode = async (data) => {
    try {
      const res = await verifyOtp(resetEmail, data.code);
      toast.success(res.message);
      return "reset";
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify code");
      return null;
    }
  };

  const changePassword = async (data) => {
    try {
      const res = await resetPassword(resetEmail, data.password);
      toast.success(res.message);
      emailForm.reset();
      otpForm.reset();
      resetForm.reset();
      setResetEmail("");
      onComplete?.();
      return "login";
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
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
