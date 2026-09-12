import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { InputField } from "../fields/InputField";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({ register, errors, onForgotPassword }) {
  const { t } = useTranslation("auth");

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <InputField
        register={register("email")}
        type="email"
        placeholder={t("fields.email")}
        error={errors.email}
      />
      <InputField
        register={register("password")}
        type="password"
        placeholder={t("fields.password")}
        error={errors.password}
      />
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="rounded border-border text-primary focus:ring-ring"
          />
          <span className="text-muted-foreground ">{t("login.rememberMe")}</span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-primary hover:underline font-medium transition-colors"
        >
          {t("login.forgotPassword")}
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border "></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card rounded-full text-muted-foreground">
            {t("login.orContinueWith")}
          </span>
        </div>
      </div>
      
      <GoogleButton />
    </motion.div>
  );
}
