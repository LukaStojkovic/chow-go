import { Button } from "../ui/button";
import Modal from "../Modal";
import { LoginForm } from "./forms/LoginForm";
import { RegisterForm } from "./forms/RegisterForm";
import { useAuthForm } from "./hooks/useAuthForm";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { InputField } from "./fields/InputField";

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

export default function AuthModal({ isOpen, setIsOpen, isLoginModal = true }) {
  const [step, setStep] = useState(isLoginModal ? "login" : "register");
  const [resetEmail, setResetEmail] = useState("");

  const {
    isLoggingIn,
    isRegistering,
    forgotPassword,
    verifyOtp,
    resetPassword,
  } = useAuthStore();

  const auth = useAuthForm(
    step === "login" || step === "register" ? step === "login" : false
  );

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

  useEffect(() => {
    if (isOpen) setStep(isLoginModal ? "login" : "register");
  }, [isOpen, isLoginModal]);

  const isLoading = auth.isSubmitting || isLoggingIn || isRegistering;

  const sendCode = async (data) => {
    try {
      const res = await forgotPassword(data.email);
      toast.success(res.message);
      setResetEmail(data.email);
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  const verifyCode = async (data) => {
    try {
      const res = await verifyOtp(resetEmail, data.code);
      toast.success(res.message);
      setStep("reset");
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  const changePassword = async (data) => {
    try {
      const res = await resetPassword(resetEmail, data.password);
      toast.success(res.message);
      setStep("login");
      emailForm.reset();
      otpForm.reset();
      resetForm.reset();
      setResetEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message);
    }
  };

  if (!isOpen) return null;

  const isForgotFlow = step === "forgot" || step === "otp" || step === "reset";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={
        isForgotFlow
          ? "Reset Password"
          : step === "login"
          ? "Welcome Back!"
          : "Join Chow & Go"
      }
      description={
        step === "forgot"
          ? "Enter your email to get a verification code"
          : step === "otp"
          ? `Check ${resetEmail} for the 6-digit code`
          : step === "reset"
          ? "Choose a new password"
          : step === "login"
          ? "Log in to track your orders and save favorites."
          : "Create an account to start ordering in seconds."
      }
      size="md"
      footer={
        isForgotFlow ? (
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {step === "forgot" && (
              <Button
                onClick={emailForm.handleSubmit(sendCode)}
                disabled={isLoading}
                className="min-w-32 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium flex items-center justify-center gap-3 px-8"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    Sending...
                  </>
                ) : (
                  "Send Code"
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="auth-form"
              disabled={isLoading}
              className="min-w-32 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium flex items-center justify-center gap-3 px-8"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  {step === "login" ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                <>{step === "login" ? "Log In" : "Sign Up"}</>
              )}
            </Button>
          </div>
        )
      }
    >
      {(step === "login" || step === "register") && (
        <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
          {step === "login" ? (
            <LoginForm
              register={auth.register}
              errors={auth.errors}
              onForgotPassword={() => setStep("forgot")}
            />
          ) : (
            <RegisterForm
              register={auth.register}
              control={auth.control}
              errors={auth.errors}
              role={auth.role}
              setRole={auth.setRole}
              imagePreview={auth.imagePreview}
              handleImageChange={auth.handleImageChange}
              removeImage={auth.removeImage}
              watchedRole={auth.watchedRole}
            />
          )}

          <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
            {step === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => setStep(step === "login" ? "register" : "login")}
              disabled={isLoading}
              className="text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              {step === "login" ? "Sign up" : "Log in"}
            </button>
          </div>
        </form>
      )}

      {step === "forgot" && (
        <form onSubmit={emailForm.handleSubmit(sendCode)} className="space-y-6">
          <InputField
            register={emailForm.register("email")}
            type="email"
            placeholder="your@email.com"
            error={emailForm.formState.errors.email}
          />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep("login")}
              className="text-sm text-green-600 hover:underline cursor-pointer"
            >
              Back to login
            </button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={otpForm.handleSubmit(verifyCode)} className="space-y-6">
          <InputField
            register={otpForm.register("code")}
            type="text"
            placeholder="000000"
            maxLength={6}
            error={otpForm.formState.errors.code}
          />
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={emailForm.handleSubmit(sendCode)}
              className="text-sm text-green-600 hover:underline cursor-pointer"
            >
              Resend code
            </button>
          </div>
          <Button
            type="submit"
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium"
          >
            Verify Code
          </Button>
        </form>
      )}

      {step === "reset" && (
        <form
          onSubmit={resetForm.handleSubmit(changePassword)}
          className="space-y-5"
        >
          <InputField
            register={resetForm.register("password")}
            type="password"
            placeholder="New password"
            error={resetForm.formState.errors.password}
          />
          <InputField
            register={resetForm.register("confirmPassword")}
            type="password"
            placeholder="Confirm password"
            error={resetForm.formState.errors.confirmPassword}
          />
          <Button
            type="submit"
            className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium"
          >
            Set New Password
          </Button>
        </form>
      )}
    </Modal>
  );
}
