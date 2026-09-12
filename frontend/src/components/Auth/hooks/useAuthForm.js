import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { msg } from "@chowgo/shared/i18n/fieldErrors";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { useAuthStore } from "@/store/useAuthStore";

const LOGIN_SCHEMA = z.object({
  email: z.string().email(msg("validation:auth.emailInvalid")),
  password: z.string().min(1, msg("validation:auth.passwordRequired")),
  rememberMe: z.boolean().optional().default(false),
});

const REGISTER_CUSTOMER_SCHEMA = z.object({
  name: z.string().min(1, msg("validation:auth.nameRequired")),
  email: z.string().email(msg("validation:auth.emailInvalid")),
  password: z.string().min(8, msg("validation:auth.passwordMin", { count: 8 })),
  phoneNumber: z.string().min(1, msg("validation:auth.phoneRequired")),
  profilePicture: z.instanceof(File).optional(),
});

const REGISTER_SELLER_SCHEMA = z.object({
  name: z.string().min(1, msg("validation:auth.nameRequired")),
  email: z.string().email(msg("validation:auth.emailInvalid")),
  password: z.string().min(8, msg("validation:auth.passwordMin", { count: 8 })),
  profilePicture: z.instanceof(File, msg("validation:profile.imageRequired")),
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

const STEPS = {
  LOGIN: "login",
  REGISTER: "register",
  RESTAURANT_INFO: "restaurant-info",
  RESTAURANT_LOCATION: "restaurant-location",
  RESTAURANT_IMAGES: "restaurant-images",
};

export function useAuthForm(currentStep, onStepSuccess) {
  const { register: registerUser, login: loginUser } = useAuthStore();
  const [role, setRole] = useState("customer");
  const [imagePreview, setImagePreview] = useState(null);
  const [registrationData, setRegistrationData] = useState({});

  const schema = useMemo(() => {
    switch (currentStep) {
      case STEPS.LOGIN:
        return LOGIN_SCHEMA;
      case STEPS.RESTAURANT_INFO:
        return RESTAURANT_INFO_SCHEMA;
      case STEPS.RESTAURANT_LOCATION:
        return RESTAURANT_LOCATION_SCHEMA;
      case STEPS.RESTAURANT_IMAGES:
        return RESTAURANT_IMAGES_SCHEMA;
      case STEPS.REGISTER:
        return role === "seller"
          ? REGISTER_SELLER_SCHEMA
          : REGISTER_CUSTOMER_SCHEMA;
      default:
        return LOGIN_SCHEMA;
    }
  }, [currentStep, role]);

  const defaultValues = useMemo(() => {
    switch (currentStep) {
      case STEPS.RESTAURANT_LOCATION:
        return {
          restaurantLat: registrationData.restaurantLat ?? 0,
          restaurantLng: registrationData.restaurantLng ?? 0,
          openingTime: registrationData.openingTime ?? "",
          closingTime: registrationData.closingTime ?? "",
        };
      case STEPS.RESTAURANT_IMAGES:
        return {
          restaurantDescription: registrationData.restaurantDescription ?? "",
          restaurantImages: registrationData.restaurantImages ?? [],
        };
      case STEPS.RESTAURANT_INFO:
        return {
          restaurantName: registrationData.restaurantName ?? "",
          restaurantPhone: registrationData.restaurantPhone ?? "",
          restaurantAddress: registrationData.restaurantAddress ?? "",
          restaurantCity: registrationData.restaurantCity ?? "",
          restaurantState: registrationData.restaurantState ?? "",
          restaurantZipCode: registrationData.restaurantZipCode ?? "",
          cuisineType: registrationData.cuisineType ?? "",
        };
      case STEPS.REGISTER:
        return role === "seller"
          ? {
              name: registrationData.name ?? "",
              email: registrationData.email ?? "",
              password: registrationData.password ?? "",
              profilePicture: registrationData.profilePicture ?? null,
            }
          : {
              name: registrationData.name ?? "",
              email: registrationData.email ?? "",
              password: registrationData.password ?? "",
              phoneNumber: registrationData.phoneNumber ?? "",
              profilePicture: registrationData.profilePicture ?? null,
            };
      default:
        return {
          email: registrationData.email ?? "",
          password: registrationData.password ?? "",
          rememberMe: false,
        };
    }
  }, [currentStep, role, registrationData]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedRole = role;

  useEffect(() => {
    reset(defaultValues);
  }, [currentStep, reset, defaultValues]);

  useEffect(() => {
    if (currentStep === STEPS.REGISTER) {
      reset(defaultValues);
    }
  }, [role, currentStep, reset, defaultValues]);

  const handleImageChange = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error(t("validation:profile.imageType"));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("validation:profile.imageSize", { size: 5 }));
        return;
      }

      setValue("profilePicture", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    },
    [setValue],
  );

  const resetForm = useCallback(() => {
    reset();
    setRole("customer");
    setImagePreview(null);
    setRegistrationData({});
  }, [reset]);

  const removeImage = useCallback(() => {
    setValue("profilePicture", null);
    setImagePreview(null);
  }, [setValue]);

  const updateRegistrationData = useCallback((data) => {
    setRegistrationData((prev) => ({ ...prev, ...data }));
  }, []);

  const onSubmit = useCallback(
    async (data) => {
      setRegistrationData((prev) => ({ ...prev, ...data }));

      if (currentStep === STEPS.LOGIN) {
        await loginUser(data);
        return;
      }

      if (currentStep === STEPS.REGISTER) {
        if (role === "customer") {
          const formData = new FormData();
          Object.keys(data).forEach((key) => {
            if (data[key] != null) {
              formData.append(key, data[key]);
            }
          });
          formData.append("role", role);
          await registerUser(formData);
        } else {
          onStepSuccess && onStepSuccess();
        }
        return;
      }

      if (
        currentStep === STEPS.RESTAURANT_INFO ||
        currentStep === STEPS.RESTAURANT_LOCATION
      ) {
        onStepSuccess && onStepSuccess();
        return;
      }

      if (currentStep === STEPS.RESTAURANT_IMAGES) {
        const allData = { ...registrationData, ...data, role: "seller" };
        const formData = new FormData();

        Object.keys(allData).forEach((key) => {
          if (key === "restaurantImages" && Array.isArray(allData[key])) {
            allData[key].forEach((file) =>
              formData.append("restaurantImages", file),
            );
          } else if (key === "profilePicture" && allData[key] instanceof File) {
            formData.append(key, allData[key]);
          } else if (allData[key] != null) {
            formData.append(key, allData[key]);
          }
        });

        await registerUser(formData);
        setRegistrationData({});
        return;
      }
    },
    [
      currentStep,
      role,
      registrationData,
      loginUser,
      registerUser,
      onStepSuccess,
    ],
  );

  return {
    role,
    setRole,
    imagePreview,
    handleImageChange,
    removeImage,
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    onSubmit: handleSubmit(onSubmit),
    watchedRole,
    reset,
    resetForm,
    watch,
    setValue,
    updateRegistrationData,
  };
}
