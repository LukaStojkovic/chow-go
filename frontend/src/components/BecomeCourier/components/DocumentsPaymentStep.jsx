import React from "react";
import { motion } from "framer-motion";
import { Controller } from "react-hook-form";
import { FormField } from "@/components/BecomeCourier/components/FormField";
import {
  STEP_3_DOCUMENTS,
  PAYMENT_METHOD,
} from "@/components/BecomeCourier/config/courierFormConfig";

export const DocumentsPaymentStep = ({ control, errors }) => {
  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 max-h-96 overflow-y-auto"
    >
      <h3 className="font-semibold text-foreground ">
        Documents & Payment
      </h3>

      {Object.entries(STEP_3_DOCUMENTS).map(([docType, docConfig]) => (
        <DocumentSection
          key={docType}
          docType={docType}
          docConfig={docConfig}
          control={control}
          errors={errors}
        />
      ))}

      <PaymentMethodSection control={control} />
    </motion.div>
  );
};

const DocumentSection = ({ docType, docConfig, control, errors }) => (
  <div className="rounded-lg border border-border p-4 ">
    <h4 className="mb-3 text-sm font-medium text-muted-foreground ">
      {docConfig.title}
    </h4>
    <div className="space-y-3">
      {Object.entries(docConfig.fields).map(([fieldType, fieldConfig]) => (
        <Controller
          key={`documents.${docType}.${fieldType}`}
          name={`documents.${docType}.${fieldType}`}
          control={control}
          render={({ field }) => (
            <FormField
              label={fieldConfig.label}
              error={errors.documents?.[docType]?.[fieldType]?.message}
            >
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
    </div>
  </div>
);

const PaymentMethodSection = ({ control }) => (
  <div className="rounded-lg border border-primary bg-primary-subtle p-4 ">
    <h4 className="mb-3 text-sm font-medium text-muted-foreground ">
      {PAYMENT_METHOD.label}
    </h4>
    <Controller
      name={PAYMENT_METHOD.name}
      control={control}
      render={({ field }) => (
        <div className="flex items-center gap-3">
          <input
            {...field}
            type="radio"
            id="cod"
            value={PAYMENT_METHOD.value}
            checked={field.value === PAYMENT_METHOD.value}
            className="h-4 w-4 accent-primary "
            disabled
          />
          <label
            htmlFor="cod"
            className="cursor-pointer text-sm text-muted-foreground "
          >
            {PAYMENT_METHOD.subLabel}
          </label>
        </div>
      )}
    />
  </div>
);
