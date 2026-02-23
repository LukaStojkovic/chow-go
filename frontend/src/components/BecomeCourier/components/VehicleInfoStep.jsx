import React from "react";
import { motion } from "framer-motion";
import { Controller } from "react-hook-form";
import { FormField } from "@/components/BecomeCourier/components/FormField";
import { STEP_2_FIELDS } from "@/components/BecomeCourier/config/courierFormConfig";

export const VehicleInfoStep = ({ control, errors }) => {
  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white">
        Vehicle Information
      </h3>

      {Object.entries(STEP_2_FIELDS).map(([key, fieldConfig]) => (
        <Controller
          key={key}
          name={fieldConfig.name}
          control={control}
          render={({ field }) => (
            <FormField label={fieldConfig.label} error={errors[key]?.message}>
              {fieldConfig.type === "select" ? (
                <select
                  {...field}
                  className="w-full rounded-lg border border-gray-300 bg-white/50 px-4 py-2.5 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                >
                  <option value="">Select vehicle type</option>
                  {fieldConfig.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...field}
                  type={fieldConfig.type}
                  placeholder={fieldConfig.placeholder}
                  className="w-full rounded-lg border border-gray-300 bg-white/50 px-4 py-2.5 text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                />
              )}
            </FormField>
          )}
        />
      ))}
    </motion.div>
  );
};
