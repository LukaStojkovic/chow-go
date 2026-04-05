import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courierApplicationSchema } from "@/lib/validationSchemas";
import { useAuthStore } from "@/store/useAuthStore";

export const useCourierForm = () => {
  const [step, setStep] = useState(1);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);
  const totalSteps = 3;

  const { registerCourier, isRegistering } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(courierApplicationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      vehicleType: "bike",
      vehicleNumber: "",
      vehicleModel: "",
      documents: {
        driverLicense: { number: "", expiryDate: "" },
        vehicleRegistration: { number: "", expiryDate: "" },
        insurance: { number: "", expiryDate: "" },
      },
      paymentMethod: "cash",
    },
  });

  const watchAllFields = watch();

  const stepLabels = {
    1: "Personal Information",
    2: "Vehicle Information",
    3: "Documents & Payment",
  };

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePreviousStep = () => setStep((prev) => prev - 1);

  const handleFormSubmit = async (data) => {
    setApiError(null);
    console.log(data);
    try {
      const payload = {
        name: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        role: "courier",
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        vehicleModel: data.vehicleModel,
        documents: JSON.stringify({
          driverLicense: data.documents?.driverLicense,
          vehicleRegistration: data.documents?.vehicleRegistration,
          insurance: data.documents?.insurance,
        }),
      };

      await registerCourier(payload);

      setSubmitSuccess(true);
      setTimeout(() => {
        setStep(1);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    }
  };

  return {
    step,
    submitSuccess,
    totalSteps,
    stepLabels,
    isLoading: isRegistering,
    apiError,
    control,
    handleSubmit,
    errors,
    watchAllFields,
    handleNextStep,
    handleFormSubmit,
    handlePreviousStep,
    setStep,
  };
};
