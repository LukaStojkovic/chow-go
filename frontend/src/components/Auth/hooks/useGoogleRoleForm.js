import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

const CUSTOMER_SCHEMA = z.object({
  phoneNumber: z.string().min(7, "Phone number is required"),
});

const RESTAURANT_INFO_SCHEMA = z.object({
  restaurantName: z.string().min(1, "Restaurant name is required"),
  restaurantPhone: z.string().min(1, "Phone number is required"),
  restaurantAddress: z.string().min(1, "Address is required"),
  restaurantCity: z.string().min(1, "City is required"),
  restaurantState: z.string().optional(),
  restaurantZipCode: z.string().min(1, "Zip code is required"),
  cuisineType: z.string().min(1, "Cuisine type is required"),
});

const RESTAURANT_LOCATION_SCHEMA = z.object({
  restaurantLat: z
    .number()
    .refine((val) => val !== 0, "Please select a location on the map"),
  restaurantLng: z
    .number()
    .refine((val) => val !== 0, "Please select a location on the map"),
  openingTime: z.string().min(1, "Opening time is required"),
  closingTime: z.string().min(1, "Closing time is required"),
});

const RESTAURANT_IMAGES_SCHEMA = z.object({
  restaurantDescription: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  restaurantImages: z
    .array(z.instanceof(File))
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images"),
});

const COURIER_INFO_SCHEMA = z.object({
  phoneNumber: z.string().min(7, "Phone number is required"),
  vehicleType: z.enum(["bike", "scooter", "motorcycle", "car"], {
    errorMap: () => ({ message: "Please select a vehicle type" }),
  }),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
});

const COURIER_DOCUMENTS_SCHEMA = z.object({
  documents: z.object({
    driverLicense: z.object({
      number: z.string().min(1, "Driver license number is required"),
      expiryDate: z.string().optional(),
    }),
    vehicleRegistration: z.object({
      number: z.string().min(1, "Registration number is required"),
      expiryDate: z.string().optional(),
    }),
    insurance: z.object({
      number: z.string().min(1, "Insurance number is required"),
      expiryDate: z.string().optional(),
    }),
  }),
});

const STEP_CONFIG = {
  customer: [
    { id: "role", title: "Choose your role" },
    { id: "customer-info", title: "Contact details" },
  ],
  seller: [
    { id: "role", title: "Choose your role" },
    { id: "restaurant-info", title: "Restaurant information" },
    { id: "restaurant-location", title: "Location & hours" },
    { id: "restaurant-images", title: "Photos & description" },
  ],
  courier: [
    { id: "role", title: "Choose your role" },
    { id: "courier-info", title: "Contact & vehicle" },
    { id: "courier-documents", title: "Documents" },
  ],
};

function getSchemaForStep(step) {
  switch (step) {
    case "customer-info":
      return CUSTOMER_SCHEMA;
    case "restaurant-info":
      return RESTAURANT_INFO_SCHEMA;
    case "restaurant-location":
      return RESTAURANT_LOCATION_SCHEMA;
    case "restaurant-images":
      return RESTAURANT_IMAGES_SCHEMA;
    case "courier-info":
      return COURIER_INFO_SCHEMA;
    case "courier-documents":
      return COURIER_DOCUMENTS_SCHEMA;
    default:
      return z.object({});
  }
}

function getDefaultValues(step, formData) {
  switch (step) {
    case "customer-info":
      return { phoneNumber: formData.phoneNumber ?? "" };
    case "restaurant-info":
      return {
        restaurantName: formData.restaurantName ?? "",
        restaurantPhone: formData.restaurantPhone ?? "",
        restaurantAddress: formData.restaurantAddress ?? "",
        restaurantCity: formData.restaurantCity ?? "",
        restaurantState: formData.restaurantState ?? "",
        restaurantZipCode: formData.restaurantZipCode ?? "",
        cuisineType: formData.cuisineType ?? "",
      };
    case "restaurant-location":
      return {
        restaurantLat: formData.restaurantLat ?? 0,
        restaurantLng: formData.restaurantLng ?? 0,
        openingTime: formData.openingTime ?? "",
        closingTime: formData.closingTime ?? "",
      };
    case "restaurant-images":
      return {
        restaurantDescription: formData.restaurantDescription ?? "",
        restaurantImages: formData.restaurantImages ?? [],
      };
    case "courier-info":
      return {
        phoneNumber: formData.phoneNumber ?? "",
        vehicleType: formData.vehicleType ?? "bike",
        vehicleNumber: formData.vehicleNumber ?? "",
        vehicleModel: formData.vehicleModel ?? "",
      };
    case "courier-documents":
      return {
        documents: formData.documents ?? {
          driverLicense: { number: "", expiryDate: "" },
          vehicleRegistration: { number: "", expiryDate: "" },
          insurance: { number: "", expiryDate: "" },
        },
      };
    default:
      return {};
  }
}

export function useGoogleRoleForm() {
  const [role, setRole] = useState("customer");
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const { completeGoogleProfile, isRegistering } = useAuthStore();
  const navigate = useNavigate();

  const steps = STEP_CONFIG[role] ?? STEP_CONFIG.customer;
  const currentStep = steps[stepIndex]?.id ?? "role";
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const schema = useMemo(() => getSchemaForStep(currentStep), [currentStep]);
  const defaultValues = useMemo(
    () => getDefaultValues(currentStep, formData),
    [currentStep, formData],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleRoleChange = useCallback((newRole) => {
    setRole(newRole);
    setStepIndex(0);
    setFormData({});
  }, []);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }, [stepIndex]);

  const navigateAfterSuccess = useCallback(
    (selectedRole) => {
      if (selectedRole === "seller") {
        navigate("/seller/dashboard", { replace: true });
      } else if (selectedRole === "courier") {
        navigate("/courier/dashboard", { replace: true });
      } else {
        navigate("/discovery", { replace: true });
      }
    },
    [navigate],
  );

  const submitRegistration = useCallback(
    async (allData) => {
      const selectedRole = role;

      if (selectedRole === "seller") {
        const payload = new FormData();
        payload.append("role", selectedRole);
        Object.entries(allData).forEach(([key, value]) => {
          if (key === "restaurantImages" && Array.isArray(value)) {
            value.forEach((file) => payload.append("restaurantImages", file));
          } else if (value != null && key !== "documents") {
            payload.append(key, value);
          }
        });
        await completeGoogleProfile(payload);
      } else if (selectedRole === "courier") {
        await completeGoogleProfile({
          role: selectedRole,
          phoneNumber: allData.phoneNumber,
          vehicleType: allData.vehicleType,
          vehicleNumber: allData.vehicleNumber,
          vehicleModel: allData.vehicleModel,
          documents: JSON.stringify(allData.documents),
        });
      } else {
        await completeGoogleProfile({
          role: selectedRole,
          phoneNumber: allData.phoneNumber,
        });
      }

      navigateAfterSuccess(selectedRole);
    },
    [role, completeGoogleProfile, navigateAfterSuccess],
  );

  const onStepSubmit = useCallback(
    async (data) => {
      const merged = { ...formData, ...data };
      setFormData(merged);

      if (currentStep === "role") {
        setStepIndex(1);
        return;
      }

      if (!isLastStep) {
        setStepIndex((prev) => prev + 1);
        return;
      }

      await submitRegistration(merged);
    },
    [formData, currentStep, isLastStep, submitRegistration],
  );

  const handleContinueFromRole = useCallback(() => {
    setStepIndex(1);
  }, []);

  useEffect(() => {
    reset(getDefaultValues(currentStep, formData));
  }, [currentStep, formData, reset]);

  return {
    role,
    setRole: handleRoleChange,
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
    reset,
    setValue,
    watch,
    onStepSubmit: handleSubmit(onStepSubmit),
    goBack,
    handleContinueFromRole,
  };
}
