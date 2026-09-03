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
  {
    id: "customer",
    label: "Customer",
    icon: User,
    description: "Order food from local restaurants",
  },
  {
    id: "seller",
    label: "Restaurant Owner",
    icon: Store,
    description: "Manage your restaurant and orders",
  },
  {
    id: "courier",
    label: "Courier",
    icon: Bike,
    description: "Deliver orders and earn money",
  },
];

function StepProgress({ steps, stepIndex }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2 flex-1">
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              index <= stepIndex
                ? "bg-primary"
                : "bg-secondary "
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
      <h3 className="font-semibold text-foreground ">
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
    <div className="min-h-screen bg-muted dark:bg-[#09090B] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-card rounded-2xl shadow-xl p-6 sm:p-8 overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          <div className="absolute top-0 right-0 w-64 sm:w-72 h-64 sm:h-72    rounded-full blur-3xl" />

          <div className="absolute bottom-0 left-0 w-56 sm:w-64 h-56 sm:h-64    rounded-full blur-3xl" />
        </motion.div>
        {!isFirstStep && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 cursor-pointer text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-foreground ">
            {stepTitle}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
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
                      className={`flex items-start gap-4 p-4 rounded-xl text-left cursor-pointer transition-all border ${
                        isActive
                          ? "bg-primary-subtle border-primary shadow-md"
                          : "bg-card/50 border-border hover:border-primary"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground "
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground ">
                          {r.label}
                        </p>
                        <p className="text-sm text-muted-foreground ">
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
            onClick={
              currentStep === "role" ? handleContinueFromRole : undefined
            }
            disabled={isRegistering}
            className="w-full h-12 bg-primary hover:bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2"
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
