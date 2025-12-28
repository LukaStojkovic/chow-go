import { Button } from "../ui/button";
import Modal from "../Modal";
import { LoginForm } from "./forms/LoginForm";
import { RegisterForm } from "./forms/RegisterForm";
import { RestaurantInfoForm } from "./forms/RestaurantInfoForm";
import { RestaurantLocationForm } from "./forms/RestaurantLocationForm";
import { RestaurantImagesForm } from "./forms/RestaurantImagesForm";
import { useAuthForm } from "./hooks/useAuthForm";
import { usePasswordReset } from "./hooks/usePasswordReset";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";
import { InputField } from "./fields/InputField";

const STEPS = {
  LOGIN: "login",
  REGISTER: "register",
  RESTAURANT_INFO: "restaurant-info",
  RESTAURANT_LOCATION: "restaurant-location",
  RESTAURANT_IMAGES: "restaurant-images",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
};

export default function AuthModal({
  isOpen,
  setIsOpen,
  initialStep = STEPS.LOGIN,
}) {
  const [step, setStep] = useState(initialStep);
  const { isLoggingIn, isRegistering, authUser } = useAuthStore();

  const handleNext = useCallback(() => {
    if (step === STEPS.REGISTER) {
      setStep(STEPS.RESTAURANT_INFO);
    } else if (step === STEPS.RESTAURANT_INFO) {
      setStep(STEPS.RESTAURANT_LOCATION);
    } else if (step === STEPS.RESTAURANT_LOCATION) {
      setStep(STEPS.RESTAURANT_IMAGES);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step === STEPS.RESTAURANT_IMAGES) {
      setStep(STEPS.RESTAURANT_LOCATION);
    } else if (step === STEPS.RESTAURANT_LOCATION) {
      setStep(STEPS.RESTAURANT_INFO);
    } else if (step === STEPS.RESTAURANT_INFO) {
      setStep(STEPS.REGISTER);
    } else if (step === STEPS.REGISTER) {
      setStep(STEPS.LOGIN);
    }
  }, [step]);

  const auth = useAuthForm(step, handleNext);

  const passwordReset = usePasswordReset(
    useCallback(() => setStep(STEPS.LOGIN), [])
  );

  const isLoading = auth.isSubmitting || isLoggingIn || isRegistering;
  const isForgotFlow = [STEPS.FORGOT, STEPS.OTP, STEPS.RESET].includes(step);

  useEffect(() => {
    if (isOpen) setStep(initialStep);
  }, [isOpen, initialStep]);

  useEffect(() => {
    if (!isOpen) {
      auth.resetForm();
      setStep(initialStep);
    }
  }, [isOpen, auth.resetForm, initialStep]);

  useEffect(() => {
    if (authUser && isOpen) {
      setIsOpen(false);
    }
  }, [authUser, isOpen, setIsOpen]);

  const footer = (
    <div className="flex gap-2 sm:gap-3 justify-end">
      <Button
        variant="outline"
        onClick={() => setIsOpen(false)}
        className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
      >
        Cancel
      </Button>
      {!isForgotFlow && (
        <Button
          type="submit"
          form="auth-form"
          disabled={isLoading}
          className="min-w-28 sm:min-w-32 h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-2 px-4 sm:px-8 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="hidden sm:inline">
                {step === STEPS.LOGIN
                  ? "Logging in..."
                  : step === STEPS.REGISTER && auth.watchedRole === "customer"
                  ? "Registering..."
                  : step === STEPS.RESTAURANT_IMAGES
                  ? "Creating..."
                  : "Next"}
              </span>
            </>
          ) : (
            <>
              {step === STEPS.LOGIN
                ? "Log In"
                : step === STEPS.REGISTER && auth.watchedRole === "customer"
                ? "Register"
                : step === STEPS.RESTAURANT_IMAGES
                ? "Complete Registration"
                : "Next"}
            </>
          )}
        </Button>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={getTitle(step)}
      description={getDescription(step, passwordReset.resetEmail)}
      size="md"
      footer={footer}
    >
      {step === STEPS.LOGIN && (
        <>
          <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
            <LoginForm
              register={auth.register}
              errors={auth.errors}
              onForgotPassword={() => setStep(STEPS.FORGOT)}
            />
          </form>
          <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setStep(STEPS.REGISTER)}
              disabled={isLoading}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>
        </>
      )}

      {step === STEPS.REGISTER && (
        <>
          <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
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
              onNext={handleNext}
            />
          </form>
          <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setStep(STEPS.LOGIN)}
              disabled={isLoading}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
            >
              Log in
            </button>
          </div>
        </>
      )}

      {step === STEPS.RESTAURANT_INFO && (
        <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
          <RestaurantInfoForm
            register={auth.register}
            errors={auth.errors}
            onNext={handleNext}
          />
        </form>
      )}

      {step === STEPS.RESTAURANT_LOCATION && (
        <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
          <RestaurantLocationForm
            register={auth.register}
            errors={auth.errors}
            watch={auth.watch}
            setValue={auth.setValue}
            onNext={handleNext}
          />
        </form>
      )}

      {step === STEPS.RESTAURANT_IMAGES && (
        <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
          <RestaurantImagesForm
            register={auth.register}
            errors={auth.errors}
            setValue={auth.setValue}
            control={auth.control}
          />
        </form>
      )}

      {step === STEPS.FORGOT && (
        <form
          onSubmit={passwordReset.emailForm.handleSubmit(async (data) => {
            const nextStep = await passwordReset.sendCode(data);
            if (nextStep) setStep(STEPS.OTP);
          })}
          className="space-y-6"
        >
          <InputField
            register={passwordReset.emailForm.register("email")}
            type="email"
            placeholder="your@email.com"
            error={passwordReset.emailForm.formState.errors.email}
          />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(STEPS.LOGIN)}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer transition-colors"
            >
              Back to login
            </button>
          </div>
        </form>
      )}

      {step === STEPS.OTP && (
        <form
          onSubmit={passwordReset.otpForm.handleSubmit(async (data) => {
            const nextStep = await passwordReset.verifyCode(data);
            if (nextStep) setStep(STEPS.RESET);
          })}
          className="space-y-6"
        >
          <InputField
            register={passwordReset.otpForm.register("code")}
            type="text"
            placeholder="000000"
            maxLength={6}
            error={passwordReset.otpForm.formState.errors.code}
          />
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={passwordReset.emailForm.handleSubmit(async (data) => {
                const nextStep = await passwordReset.sendCode(data);
                if (nextStep) setStep(STEPS.OTP);
              })}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer transition-colors"
            >
              Resend code
            </button>
          </div>
          <Button
            type="submit"
            className="w-full h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm sm:text-base"
          >
            Verify Code
          </Button>
        </form>
      )}

      {step === STEPS.RESET && (
        <form
          onSubmit={passwordReset.resetForm.handleSubmit(async (data) => {
            const nextStep = await passwordReset.changePassword(data);
            if (nextStep) setStep(STEPS.LOGIN);
          })}
          className="space-y-5"
        >
          <InputField
            register={passwordReset.resetForm.register("password")}
            type="password"
            placeholder="New password"
            error={passwordReset.resetForm.formState.errors.password}
          />
          <InputField
            register={passwordReset.resetForm.register("confirmPassword")}
            type="password"
            placeholder="Confirm password"
            error={passwordReset.resetForm.formState.errors.confirmPassword}
          />
          <Button
            type="submit"
            className="w-full h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm sm:text-base"
          >
            Set New Password
          </Button>
        </form>
      )}
    </Modal>
  );
}

function getTitle(step) {
  switch (step) {
    case STEPS.FORGOT:
    case STEPS.OTP:
    case STEPS.RESET:
      return "Reset Password";
    case STEPS.RESTAURANT_INFO:
      return "Restaurant Information";
    case STEPS.RESTAURANT_LOCATION:
      return "Restaurant Location & Hours";
    case STEPS.RESTAURANT_IMAGES:
      return "Restaurant Photos & Description";
    case STEPS.LOGIN:
      return "Welcome Back!";
    case STEPS.REGISTER:
      return "Join Chow & Go";
    default:
      return "Authentication";
  }
}

function getDescription(step, resetEmail) {
  switch (step) {
    case STEPS.RESTAURANT_INFO:
      return "Tell us about your restaurant";
    case STEPS.RESTAURANT_LOCATION:
      return "Select your location and operating hours";
    case STEPS.RESTAURANT_IMAGES:
      return "Add photos and describe your restaurant";
    case STEPS.FORGOT:
      return "Enter your email to get a verification code";
    case STEPS.OTP:
      return `Check ${resetEmail} for the 6-digit code`;
    case STEPS.RESET:
      return "Choose a new password";
    case STEPS.LOGIN:
      return "Log in to track your orders and save favorites.";
    case STEPS.REGISTER:
      return "Create an account to start ordering in seconds.";
    default:
      return "";
  }
}
