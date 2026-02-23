import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

const LOGIN_SCHEMA = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const REGISTER_CUSTOMER_SCHEMA = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  profilePicture: z.instanceof(File).optional(),
});

const REGISTER_SELLER_SCHEMA = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  profilePicture: z.instanceof(File, "Profile image is required"),
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
          restaurantLat: 0,
          restaurantLng: 0,
          openingTime: "",
          closingTime: "",
        };
      case STEPS.RESTAURANT_IMAGES:
        return {
          restaurantDescription: "",
          restaurantImages: [],
        };
      case STEPS.RESTAURANT_INFO:
        return {
          restaurantName: "",
          restaurantPhone: "",
          restaurantAddress: "",
          restaurantCity: "",
          restaurantState: "",
          restaurantZipCode: "",
          cuisineType: "",
        };
      case STEPS.REGISTER:
        return role === "seller"
          ? {
              name: "",
              email: "",
              password: "",
              profilePicture: null,
            }
          : {
              name: "",
              email: "",
              password: "",
              phoneNumber: "",
              profilePicture: null,
            };
      default:
        return {
          email: "",
          password: "",
        };
    }
  }, [currentStep, role]);

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
        toast.error("Please select an image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
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
  };
}
