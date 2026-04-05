import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCourierForm } from "@/components/BecomeCourier/hooks/useCourierForm";
import { StepIndicator } from "@/components/BecomeCourier/components/StepIndicator";
import { PersonalInfoStep } from "@/components/BecomeCourier/components/PersonalInfoStep";
import { VehicleInfoStep } from "@/components/BecomeCourier/components/VehicleInfoStep";
import { DocumentsPaymentStep } from "@/components/BecomeCourier/components/DocumentsPaymentStep";
import { SuccessScreen } from "@/components/BecomeCourier/components/SuccessScreen";
import { FormNavigationButtons } from "@/components/BecomeCourier/components/FormNavigationButtons";

export default function ApplicationForm({ openAuthModal }) {
  const {
    step,
    submitSuccess,
    totalSteps,
    isLoading,
    apiError,
    control,
    handleSubmit,
    errors,
    handleNextStep,
    handleFormSubmit,
    handlePreviousStep,
  } = useCourierForm();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="w-full max-w-md lg:w-1/2"
    >
      <div className="rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {submitSuccess ? "Application Submitted" : "Become a Courier"}
        </h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {submitSuccess ? "" : `Complete all ${totalSteps} steps to apply`}
        </p>

        <AnimatePresence mode="wait">
          {submitSuccess ? (
            <SuccessScreen key="success" />
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-6"
            >
              <StepIndicator currentStep={step} totalSteps={totalSteps} />

              {step === 1 && (
                <PersonalInfoStep control={control} errors={errors} />
              )}
              {step === 2 && (
                <VehicleInfoStep control={control} errors={errors} />
              )}
              {step === 3 && (
                <DocumentsPaymentStep control={control} errors={errors} />
              )}

              {apiError && (
                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 darkck:bg-red-900/20 dark:text-red-400">
                  {apiError}
                </p>
              )}

              <FormNavigationButtons
                step={step}
                totalSteps={totalSteps}
                onPrevious={handlePreviousStep}
                onNext={handleNextStep}
                isLoading={isLoading}
              />

              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Already have a courier account?{" "}
                <button
                  type="button"
                  onClick={() => openAuthModal(true)}
                  className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Sign in here
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}