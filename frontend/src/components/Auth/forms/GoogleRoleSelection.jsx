import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Store, Bike, ArrowLeft, ChevronRight } from "lucide-react";
import Spinner from "@/components/Spinner";
import { InputField } from "../fields/InputField";
import { RestaurantInfoForm } from "../forms/RestaurantInfoForm";
import { RestaurantLocationForm } from "../forms/RestaurantLocationForm";
import { RestaurantImagesForm } from "../forms/RestaurantImagesForm";
import { VehicleInfoStep } from "@/components/BecomeCourier/components/VehicleInfoStep";
import { DocumentsPaymentStep } from "@/components/BecomeCourier/components/DocumentsPaymentStep";
import { useGoogleRoleForm } from "../hooks/useGoogleRoleForm";

const ROLES = [
  { id: "customer", label: "Customer", icon: User, description: "Order food from local restaurants" },
  { id: "seller", label: "Restaurant Owner", icon: Store, description: "Manage your restaurant and orders" },
  { id: "courier", label: "Courier", icon: Bike, description: "Deliver orders and earn money" },
];

function StepProgress({ steps, stepIndex }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2 flex-1">
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              index <= stepIndex
                ? "bg-emerald-600"
                : "bg-gray-200 dark:bg-zinc-700"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function CourierPhoneField({ register, errors }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        Contact Information
      </h3>
      <InputField
        register={register("phoneNumber")}
        type="tel"
        placeholder="Phone number"
        error={errors.phoneNumber}
      />
    </div>
  );
}

export function GoogleRoleSelection() {
  const {
    role,
    setRole,
    currentStep,
    stepIndex,
    steps,
    isFirstStep,
    isLastStep,
    isRegistering,
    register,
    handleSubmit,
    control,
    errors,
    setValue,
    watch,
    onStepSubmit,
    goBack,
    handleContinueFromRole,
  } = useGoogleRoleForm();

  const stepTitle = steps[stepIndex]?.title ?? "Complete your profile";
  const submitLabel = isLastStep ? "Create Account" : "Continue";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
      >
        {!isFirstStep && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stepTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {currentStep === "role"
              ? "How would you like to use Chow & Go?"
              : "Fill in the details below to finish setting up your account"}
          </p>
        </div>

        {!isFirstStep && <StepProgress steps={steps} stepIndex={stepIndex} />}

        <form onSubmit={onStepSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {currentStep === "role" && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3"
              >
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isActive = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all border ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md"
                          : "bg-white/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 hover:border-emerald-300"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {r.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {currentStep === "customer-info" && (
              <motion.div
                key="customer-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <InputField
                  register={register("phoneNumber")}
                  type="tel"
                  placeholder="Phone number"
                  error={errors.phoneNumber}
                />
              </motion.div>
            )}

            {currentStep === "restaurant-info" && (
              <motion.div
                key="restaurant-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RestaurantInfoForm register={register} errors={errors} />
              </motion.div>
            )}

            {currentStep === "restaurant-location" && (
              <motion.div
                key="restaurant-location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RestaurantLocationForm
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                />
              </motion.div>
            )}

            {currentStep === "restaurant-images" && (
              <motion.div
                key="restaurant-images"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RestaurantImagesForm
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  control={control}
                />
              </motion.div>
            )}

            {currentStep === "courier-info" && (
              <motion.div
                key="courier-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <CourierPhoneField register={register} errors={errors} />
                <VehicleInfoStep control={control} errors={errors} />
              </motion.div>
            )}

            {currentStep === "courier-documents" && (
              <motion.div
                key="courier-documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DocumentsPaymentStep control={control} errors={errors} />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type={currentStep === "role" ? "button" : "submit"}
            onClick={currentStep === "role" ? handleContinueFromRole : undefined}
            disabled={isRegistering}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <>
                <Spinner size="sm" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                {submitLabel}
                {!isLastStep && currentStep !== "role" && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
