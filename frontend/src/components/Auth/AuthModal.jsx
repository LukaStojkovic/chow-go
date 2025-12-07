import { Button } from "../ui/button";
import Modal from "../Modal";
import { LoginForm } from "./forms/LoginForm";
import { RegisterForm } from "./forms/RegisterForm";
import { RestaurantInfoForm } from "./forms/RestaurantInfoForm";
import { RestaurantLocationForm } from "./forms/RestaurantLocationForm";
import { useAuthForm } from "./hooks/useAuthForm";
import { usePasswordReset } from "./hooks/usePasswordReset";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";
import { InputField } from "./fields/InputField";

export default function AuthModal({ isOpen, setIsOpen, isLoginModal = true }) {
  const [step, setStep] = useState(isLoginModal ? "login" : "register");
  const { isLoggingIn, isRegistering, authUser } = useAuthStore();

  const auth = useAuthForm(
    step === "login" ||
      step === "register" ||
      step === "restaurant-info" ||
      step === "restaurant-location"
      ? step === "login"
      : false,
    "customer",
    useCallback((isRestaurantStep) => {
      if (isRestaurantStep) setStep("restaurant-info");
    }, [])
  );

  const passwordReset = usePasswordReset(
    useCallback(() => setStep("login"), [])
  );

  useEffect(() => {
    if (isOpen) setStep(isLoginModal ? "login" : "register");
  }, [isOpen, isLoginModal]);

  useEffect(() => {
    if (auth.showRestaurantLocationStep && step !== "restaurant-location") {
      setStep("restaurant-location");
    }
  }, [auth.showRestaurantLocationStep, step]);

  useEffect(() => {
    if (authUser && isOpen) {
      setIsOpen(false);
    }
  }, [authUser, isOpen, setIsOpen]);

  const isLoading = auth.isSubmitting || isLoggingIn || isRegistering;
  const isForgotFlow = step === "forgot" || step === "otp" || step === "reset";

  const footer = useMemo(
    () =>
      renderFooter(step, isLoading, auth, passwordReset, setStep, setIsOpen),
    [step, isLoading, auth, passwordReset]
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={getTitle(step, isForgotFlow)}
      description={getDescription(step, passwordReset.resetEmail, isForgotFlow)}
      size="md"
      footer={footer}
    >
      {step === "login" && (
        <>
          <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
            <LoginForm
              register={auth.register}
              errors={auth.errors}
              onForgotPassword={() => setStep("forgot")}
            />
          </form>
          <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setStep("register")}
              disabled={isLoading}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>
        </>
      )}

      {step === "register" && (
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
            />
          </form>
          <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setStep("login")}
              disabled={isLoading}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
            >
              Log in
            </button>
          </div>
        </>
      )}

      {step === "restaurant-info" && (
        <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
          <RestaurantInfoForm register={auth.register} errors={auth.errors} />
        </form>
      )}

      {step === "restaurant-location" && (
        <form id="auth-form" onSubmit={auth.onSubmit} className="space-y-5">
          <RestaurantLocationForm
            register={auth.register}
            errors={auth.errors}
            watch={auth.watch}
            setValue={auth.setValue}
          />
        </form>
      )}

      {step === "forgot" && (
        <form
          onSubmit={passwordReset.emailForm.handleSubmit(async (data) => {
            const nextStep = await passwordReset.sendCode(data);
            if (nextStep) setStep(nextStep);
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
              onClick={() => setStep("login")}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer transition-colors"
            >
              Back to login
            </button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={passwordReset.otpForm.handleSubmit(async (data) => {
            const nextStep = await passwordReset.verifyCode(data);
            if (nextStep) setStep(nextStep);
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
                if (nextStep) setStep(nextStep);
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

      {step === "reset" && (
        <form
          onSubmit={passwordReset.resetForm.handleSubmit(async (data) => {
            const nextStep = await passwordReset.changePassword(data);
            if (nextStep) setStep(nextStep);
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

function getTitle(step, isForgotFlow) {
  if (isForgotFlow) return "Reset Password";
  if (step === "restaurant-info") return "Restaurant Information";
  if (step === "restaurant-location") return "Restaurant Location & Hours";
  if (step === "login") return "Welcome Back!";
  return "Join Chow & Go";
}

function getDescription(step, resetEmail, isForgotFlow) {
  if (step === "restaurant-info") return "Tell us about your restaurant";
  if (step === "restaurant-location")
    return "Select your location and operating hours";
  if (step === "forgot") return "Enter your email to get a verification code";
  if (step === "otp") return `Check ${resetEmail} for the 6-digit code`;
  if (step === "reset") return "Choose a new password";
  if (step === "login")
    return "Log in to track your orders and save favorites.";
  return "Create an account to start ordering in seconds.";
}

function renderFooter(
  step,
  isLoading,
  auth,
  passwordReset,
  setStep,
  setIsOpen
) {
  const isForgotFlow = step === "forgot" || step === "otp" || step === "reset";

  if (isForgotFlow) {
    return (
      <div className="flex gap-2 sm:gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
        >
          Cancel
        </Button>
        {step === "forgot" && (
          <Button
            onClick={passwordReset.emailForm.handleSubmit(async (data) => {
              const nextStep = await passwordReset.sendCode(data);
              if (nextStep) setStep(nextStep);
            })}
            disabled={isLoading}
            className="min-w-28 sm:min-w-32 h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-2 px-4 sm:px-8 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span className="hidden sm:inline">Sending...</span>
              </>
            ) : (
              "Send Code"
            )}
          </Button>
        )}
      </div>
    );
  }

  if (step === "restaurant-info") {
    return (
      <div className="flex gap-2 sm:gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setStep("register");
            auth.setShowRestaurantStep(false);
          }}
          disabled={isLoading}
          className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
        >
          Back
        </Button>
        <Button
          type="submit"
          form="auth-form"
          disabled={isLoading}
          className="min-w-28 sm:min-w-32 h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-2 px-4 sm:px-8 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="hidden sm:inline">Next...</span>
            </>
          ) : (
            <>Next</>
          )}
        </Button>
      </div>
    );
  }

  if (step === "restaurant-location") {
    return (
      <div className="flex gap-2 sm:gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setStep("restaurant-info");
            auth.setShowRestaurantLocationStep(false);
          }}
          disabled={isLoading}
          className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
        >
          Back
        </Button>
        <Button
          type="submit"
          form="auth-form"
          disabled={isLoading}
          className="min-w-28 sm:min-w-32 h-10 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-2 px-4 sm:px-8 text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/20"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="hidden sm:inline">Creating...</span>
            </>
          ) : (
            <>Complete Registration</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-end">
      <Button
        variant="outline"
        onClick={() => setIsOpen(false)}
        disabled={isLoading}
        className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
      >
        Cancel
      </Button>
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
              {step === "login" ? "Logging in..." : "Creating..."}
            </span>
          </>
        ) : (
          <>{step === "login" ? "Log In" : "Sign Up"}</>
        )}
      </Button>
    </div>
  );
}
