import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["auth", "profile", "common"]);
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

  const auth = useAuthForm(step, handleNext);

  const handleBack = useCallback(() => {
    const currentData = auth.watch();
    auth.updateRegistrationData(currentData);

    if (step === STEPS.RESTAURANT_IMAGES) {
      setStep(STEPS.RESTAURANT_LOCATION);
    } else if (step === STEPS.RESTAURANT_LOCATION) {
      setStep(STEPS.RESTAURANT_INFO);
    } else if (step === STEPS.RESTAURANT_INFO) {
      setStep(STEPS.REGISTER);
    } else if (step === STEPS.REGISTER) {
      setStep(STEPS.LOGIN);
    }
  }, [step, auth]);

  const passwordReset = usePasswordReset(
    useCallback(() => setStep(STEPS.LOGIN), []),
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
      {step !== STEPS.LOGIN && !isForgotFlow && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
        >
          {t("common:actions.back")}
        </Button>
      )}
      <Button
        variant="outline"
        onClick={() => setIsOpen(false)}
        className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm"
      >
        {t("common:actions.cancel")}
      </Button>
      {!isForgotFlow && (
        <Button
          type="submit"
          form="auth-form"
          disabled={isLoading}
          className="min-w-28 sm:min-w-32 h-10 sm:h-12 bg-primary hover:bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl flex items-center justify-center gap-2 px-4 sm:px-8 text-xs sm:text-sm transition-all shadow-lg "
        >
          {isLoading ? (
            <>
              <Spinner size="sm" />
              <span className="hidden sm:inline">
                {step === STEPS.LOGIN
                  ? t("auth:login.submitting")
                  : step === STEPS.REGISTER && auth.watchedRole === "customer"
                    ? t("auth:register.submitting")
                    : step === STEPS.RESTAURANT_IMAGES
                      ? t("common:state.saving")
                      : t("common:actions.next")}
              </span>
            </>
          ) : (
            <>
              {step === STEPS.LOGIN
                ? t("auth:login.submit")
                : step === STEPS.REGISTER && auth.watchedRole === "customer"
                  ? t("auth:register.submit")
                  : step === STEPS.RESTAURANT_IMAGES
                    ? t("auth:register.complete")
                    : t("common:actions.next")}
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
      title={getTitle(step, t)}
      description={getDescription(step, passwordReset.resetEmail, t)}
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
          <div className="text-center text-xs sm:text-sm text-muted-foreground pt-4">
            {t("auth:login.noAccount")}{" "}
            <button
              type="button"
              onClick={() => setStep(STEPS.REGISTER)}
              disabled={isLoading}
              className="text-primary cursor-pointer font-medium hover:underline transition-colors"
            >
              {t("auth:register.submit")}
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
          <div className="text-center text-xs sm:text-sm text-muted-foreground pt-4">
            {t("auth:register.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => setStep(STEPS.LOGIN)}
              disabled={isLoading}
              className="text-primary cursor-pointer font-medium hover:underline transition-colors"
            >
              {t("auth:login.submit")}
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
              className="text-xs sm:text-sm text-primary hover:underline cursor-pointer transition-colors"
            >
              {t("auth:reset.backToLogin")}
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
              className="text-xs sm:text-sm text-primary hover:underline cursor-pointer transition-colors"
            >
              {t("auth:reset.resendCode")}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full h-10 sm:h-12 bg-primary hover:bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg  text-sm sm:text-base"
          >
            {t("auth:reset.verifyCode")}
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
            placeholder={t("profile:account.newPassword")}
            error={passwordReset.resetForm.formState.errors.password}
          />
          <InputField
            register={passwordReset.resetForm.register("confirmPassword")}
            type="password"
            placeholder={t("auth:fields.confirmPassword")}
            error={passwordReset.resetForm.formState.errors.confirmPassword}
          />
          <Button
            type="submit"
            className="w-full h-10 sm:h-12 bg-primary hover:bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg  text-sm sm:text-base"
          >
            {t("auth:reset.setPassword")}
          </Button>
        </form>
      )}
    </Modal>
  );
}

function getTitle(step, t) {
  switch (step) {
    case STEPS.FORGOT:
    case STEPS.OTP:
    case STEPS.RESET:
      return t("auth:reset.title");
    case STEPS.RESTAURANT_INFO:
      return t("auth:restaurant.infoTitle");
    case STEPS.RESTAURANT_LOCATION:
      return t("auth:restaurant.locationTitle");
    case STEPS.RESTAURANT_IMAGES:
      return t("auth:restaurant.imagesTitle");
    case STEPS.LOGIN:
      return t("auth:login.title");
    case STEPS.REGISTER:
      return t("auth:register.title");
    default:
      return t("auth:guard.signInRequired");
  }
}

function getDescription(step, resetEmail, t) {
  switch (step) {
    case STEPS.RESTAURANT_INFO:
      return t("auth:restaurant.infoDescription");
    case STEPS.RESTAURANT_LOCATION:
      return t("auth:restaurant.locationDescription");
    case STEPS.RESTAURANT_IMAGES:
      return t("auth:restaurant.imagesDescription");
    case STEPS.FORGOT:
      return t("auth:reset.emailDescription");
    case STEPS.OTP:
      return t("auth:reset.codeSent", { email: resetEmail });
    case STEPS.RESET:
      return t("auth:reset.newPasswordDescription");
    case STEPS.LOGIN:
      return t("auth:login.description");
    case STEPS.REGISTER:
      return t("auth:register.description");
    default:
      return "";
  }
}
