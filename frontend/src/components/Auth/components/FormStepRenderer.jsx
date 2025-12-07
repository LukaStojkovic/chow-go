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
  setValue,
}) => {
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
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => onAction({ type: "goToForgot" })}
            className="text-green-600 hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => onAction({ type: "goToRegister" })}
            className="text-green-600 dark:text-green-400 font-medium hover:underline"
          >
            Sign up
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
          placeholder="your@email.com"
          error={errors.email}
        />
        <div className="text-center">
          <button
            type="button"
            onClick={() => onAction({ type: "goToLogin" })}
            className="text-sm text-green-600 hover:underline cursor-pointer"
          >
            Back to login
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
          className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium"
        >
          Set New Password
        </Button>
      </form>
    );
  }

  return null;
};
