import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export const SuccessScreen = () => {
  const { t } = useTranslation("courier");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 text-center"
    >
      <div className="flex justify-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-subtle "
          role="img"
          aria-label={t("signup.success.title")}
        >
          <Check
            className="h-8 w-8 text-primary "
            aria-hidden="true"
          />
        </div>
      </div>{" "}
      <p className="text-sm text-muted-foreground ">
        {t("signup.success.title")}
      </p>
      <p className="text-xs text-muted-foreground ">
        {t("signup.success.description")}
      </p>
    </motion.div>
  );
};
