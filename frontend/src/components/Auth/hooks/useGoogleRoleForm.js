import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

const CUSTOMER_SCHEMA = z.object({
  phoneNumber: z.string().min(7, msg("validation:auth.phoneRequired")),
});

const RESTAURANT_INFO_SCHEMA = z.object({
  restaurantName: z.string().min(1, msg("validation:restaurant.nameRequired")),
  restaurantPhone: z.string().min(1, msg("validation:auth.phoneRequired")),
  restaurantAddress: z.string().min(1, msg("validation:restaurant.addressRequired")),
  restaurantCity: z.string().min(1, msg("validation:restaurant.cityRequired")),
  restaurantState: z.string().optional(),
  restaurantZipCode: z.string().min(1, msg("validation:restaurant.zipRequired")),
  cuisineType: z.string().min(1, msg("validation:restaurant.cuisineRequired")),
});

const RESTAURANT_LOCATION_SCHEMA = z.object({
  restaurantLat: z
    .number()
    .refine((val) => val !== 0, msg("validation:restaurant.locationRequired")),
  restaurantLng: z
    .number()
    .refine((val) => val !== 0, msg("validation:restaurant.locationRequired")),
  openingTime: z.string().min(1, msg("validation:restaurant.openingRequired")),
  closingTime: z.string().min(1, msg("validation:restaurant.closingRequired")),
});

const RESTAURANT_IMAGES_SCHEMA = z.object({
  restaurantDescription: z
    .string()
    .min(10, msg("validation:restaurant.descriptionMin", { count: 10 })),
  restaurantImages: z
    .array(z.instanceof(File))
    .min(1, msg("validation:restaurant.imagesRequired"))
    .max(10, msg("validation:restaurant.imagesMax", { count: 10 })),
});

const COURIER_INFO_SCHEMA = z.object({
  phoneNumber: z.string().min(7, msg("validation:auth.phoneRequired")),
  vehicleType: z.enum(["bike", "scooter", "motorcycle", "car"], {
    errorMap: () => ({ message: msg("validation:courier.vehicleTypeRequired") }),
  }),
  vehicleNumber: z.string().min(1, msg("validation:courier.vehicleNumberRequired")),
  vehicleModel: z.string().min(1, msg("validation:courier.vehicleModelRequired")),
});

const COURIER_DOCUMENTS_SCHEMA = z.object({
  documents: z.object({
    driverLicense: z.object({
      number: z.string().min(1, msg("validation:courier.licenseNumberRequired")),
      expiryDate: z.string().optional(),
    }),
    vehicleRegistration: z.object({
      number: z.string().min(1, msg("validation:courier.registrationNumberRequired")),
      expiryDate: z.string().optional(),
    }),
    insurance: z.object({
      number: z.string().min(1, msg("validation:courier.insuranceNumberRequired")),
      expiryDate: z.string().optional(),
    }),
  }),
});

const STEP_CONFIG = {
  customer: [
    { id: "role", title: "auth:google.stepRole" },
    { id: "customer-info", title: "auth:google.stepContact" },
  ],
  seller: [
    { id: "role", title: "auth:google.stepRole" },
    { id: "restaurant-info", title: "auth:restaurant.infoTitle" },
    { id: "restaurant-location", title: "auth:restaurant.locationTitle" },
    { id: "restaurant-images", title: "auth:restaurant.imagesTitle" },
  ],
  courier: [
    { id: "role", title: "auth:google.stepRole" },
    { id: "courier-info", title: "auth:google.stepCourierInfo" },
    { id: "courier-documents", title: "auth:google.stepDocuments" },
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
