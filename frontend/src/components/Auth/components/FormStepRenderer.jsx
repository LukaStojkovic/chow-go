import { useTranslation } from "react-i18next";

import { FormFieldRenderer } from "./FormFieldRenderer";
import { InputField } from "../fields/InputField";
import { Button } from "../../ui/button";

export const FormStepRenderer = ({
  step,
  formData,
  register,
  errors,
  onAction,
  watch,
}) => {
  const { t } = useTranslation(["auth", "common"]);

  if (step === "login") {
    return (
      <form id="auth-form" onSubmit={onAction} className="space-y-5">
        <FormFieldRenderer
          fields={["email", "password"]}
          register={register}
          errors={errors}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>{t("auth:login.rememberMe")}</span>
          </label>
          <button
            type="button"
            onClick={() => onAction({ type: "goToForgot" })}
            className="text-primary hover:underline cursor-pointer"
          >
            {t("auth:login.forgotPassword")}
          </button>
        </div>
        <div className="text-center text-sm text-muted-foreground pt-4">
          {t("auth:login.noAccount")}{" "}
          <button
            type="button"
            onClick={() => onAction({ type: "goToRegister" })}
            className="text-primary cursor-pointer font-medium hover:underline"
          >
            {t("auth:register.submit")}
          </button>
        </div>
      </form>
    );
  }

  if (step === "register") {
    const { RegisterForm } = require("../forms/RegisterForm");
    return <RegisterForm {...formData} />;
  }

  if (step === "restaurant-info") {
    const { RestaurantInfoForm } = require("../forms/RestaurantInfoForm");
    return (
      <form id="auth-form" onSubmit={onAction} className="space-y-5">
        <RestaurantInfoForm register={register} errors={errors} />
      </form>
    );
  }

  if (step === "restaurant-location") {
    const {
      RestaurantLocationForm,
    } = require("../forms/RestaurantLocationForm");
    return (
      <form id="auth-form" onSubmit={onAction} className="space-y-5">
        <RestaurantLocationForm
          register={register}
          errors={errors}
          watch={watch}
        />
      </form>
    );
  }

  if (step === "forgot") {
    return (
      <form onSubmit={onAction} className="space-y-6">
        <InputField
          register={register("email")}
          type="email"
          placeholder={t("auth:fields.emailPlaceholder")}
          error={errors.email}
        />
        <div className="text-center">
          <button
            type="button"
            onClick={() => onAction({ type: "goToLogin" })}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            {t("auth:reset.backToLogin")}
          </button>
        </div>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={onAction} className="space-y-6">
        <InputField
          register={register("code")}
          type="text"
          placeholder="000000"
          maxLength={6}
          error={errors.code}
        />
        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => onAction({ type: "resendCode" })}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            {t("auth:reset.resendCode")}
          </button>
        </div>
        <Button
          type="submit"
          className="w-full font-medium"
        >
          {t("auth:reset.verifyCode")}
        </Button>
      </form>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={onAction} className="space-y-5">
        <FormFieldRenderer
          fields={["password", "confirmPassword"]}
          register={register}
          errors={errors}
        />
        <Button
          type="submit"
          className="w-full      text-white font-medium"
        >
          {t("auth:reset.setPassword")}
        </Button>
      </form>
    );
  }

  return null;
};
