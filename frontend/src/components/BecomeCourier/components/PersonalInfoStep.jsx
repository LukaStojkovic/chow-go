import React from "react";
import { motion } from "framer-motion";
import { Controller } from "react-hook-form";
import { FormField } from "@/components/BecomeCourier/components/FormField";
import { STEP_1_FIELDS } from "@/components/BecomeCourier/config/courierFormConfig";

export const PersonalInfoStep = ({ control, errors }) => {
  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="font-semibold text-foreground ">
        Personal Information
      </h3>

      {Object.entries(STEP_1_FIELDS).map(([key, fieldConfig]) => (
        <Controller
          key={key}
          name={fieldConfig.name}
          control={control}
          render={({ field }) => (
            <FormField label={fieldConfig.label} error={errors[key]?.message}>
              <input
                {...field}
                type={fieldConfig.type}
                placeholder={fieldConfig.placeholder}
                className="w-full rounded-lg border border-border bg-card/50 px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring "
              />
            </FormField>
          )}
        />
      ))}
    </motion.div>
  );
};
