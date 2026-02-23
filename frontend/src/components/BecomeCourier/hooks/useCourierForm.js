import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courierApplicationSchema } from "@/lib/validationSchemas";

export const useCourierForm = () => {
  const [step, setStep] = useState(1);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const totalSteps = 3;

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

  const handleNextStep = () => {
    const stepData = {
      step,
      label: stepLabels[step],
      timestamp: new Date().toISOString(),
    };

    if (step === 1) {
      stepData.data = {
        fullName: watchAllFields.fullName,
        email: watchAllFields.email,
        phoneNumber: watchAllFields.phoneNumber,
      };
    } else if (step === 2) {
      stepData.data = {
        vehicleType: watchAllFields.vehicleType,
        vehicleNumber: watchAllFields.vehicleNumber,
        vehicleModel: watchAllFields.vehicleModel,
      };
    } else if (step === 3) {
      stepData.data = {
        documents: watchAllFields.documents,
        paymentMethod: watchAllFields.paymentMethod,
      };
    }

    console.log(`✅ Step ${step} Completed:`, stepData);
    setStep(step + 1);
  };

  const handleFormSubmit = (data) => {
    console.log({
      step: 3,
      label: "Documents & Payment",
      timestamp: new Date().toISOString(),
      data: {
        documents: data.documents,
        paymentMethod: data.paymentMethod,
      },
    });

    console.log({
      timestamp: new Date().toISOString(),
      personalInfo: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
      vehicleInfo: {
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        vehicleModel: data.vehicleModel,
      },
      documents: data.documents,
      paymentMethod: data.paymentMethod,
    });

    setSubmitSuccess(true);
    setTimeout(() => {
      setStep(1);
      setSubmitSuccess(false);
    }, 3000);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const proceed = () => {
    if (step < totalSteps) {
      handleNextStep();
    }
  };

  return {
    step,
    submitSuccess,
    totalSteps,
    stepLabels,

    control,
    handleSubmit,
    errors,
    watchAllFields,

    handleNextStep,
    handleFormSubmit,
    handlePreviousStep,
    proceed,
    setStep,
  };
};
