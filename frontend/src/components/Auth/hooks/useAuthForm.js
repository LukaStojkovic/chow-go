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

const REGISTER_SCHEMA = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Min 6 characters"),
    role: z.enum(["customer", "seller"]),
    profilePicture: z.any().optional(),
    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number")
      .optional(),
  })
  .refine((d) => d.role !== "seller" || d.profilePicture instanceof File, {
    message: "Profile image is required",
    path: ["profilePicture"],
  })
  .refine(
    (d) =>
      d.role !== "customer" || (d.phoneNumber && d.phoneNumber.length >= 10),
    {
      message: "Phone number is required for customers",
      path: ["phoneNumber"],
    }
  );

const RESTAURANT_INFO_SCHEMA = z.object({
  restaurantName: z.string().min(1, "Restaurant name is required"),
  restaurantPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number"),
  restaurantAddress: z.string().min(5, "Address is required"),
  restaurantCity: z.string().min(1, "City is required"),
  restaurantState: z.string().min(1, "State/Province is required"),
  restaurantZipCode: z.string().min(3, "Zip code is required"),
  cuisineType: z.string().min(1, "Cuisine type is required"),
});

const RESTAURANT_LOCATION_SCHEMA = z
  .object({
    restaurantLat: z
      .number()
      .refine((val) => val !== 0, "Please select a location on the map"),
    restaurantLng: z
      .number()
      .refine((val) => val !== 0, "Please select a location on the map"),
    openingTime: z.string().min(1, "Opening time is required"),
    closingTime: z.string().min(1, "Closing time is required"),
  })
  .refine(
    (data) => {
      if (!data.openingTime || !data.closingTime) return true;
      const [openHour, openMin] = data.openingTime.split(":").map(Number);
      const [closeHour, closeMin] = data.closingTime.split(":").map(Number);
      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;
      return closeTime > openTime;
    },
    {
      message: "Closing time must be after opening time",
      path: ["closingTime"],
    }
  );

export function useAuthForm(
  isLogin,
  initialRole = "customer",
  onRestaurantInfoStep = null
) {
  const { register: registerUser, login: loginUser } = useAuthStore();
  const [role, setRole] = useState(initialRole);
  const [imagePreview, setImagePreview] = useState(null);
  const [showRestaurantStep, setShowRestaurantStep] = useState(false);
  const [showRestaurantLocationStep, setShowRestaurantLocationStep] =
    useState(false);
  const [userRegistrationData, setUserRegistrationData] = useState(null);
  const [restaurantInfoData, setRestaurantInfoData] = useState(null);

  const schema = useMemo(() => {
    if (isLogin) return LOGIN_SCHEMA;
    if (showRestaurantLocationStep) return RESTAURANT_LOCATION_SCHEMA;
    return showRestaurantStep ? RESTAURANT_INFO_SCHEMA : REGISTER_SCHEMA;
  }, [isLogin, showRestaurantStep, showRestaurantLocationStep]);

  const defaultValues = useMemo(() => {
    if (showRestaurantLocationStep) {
      return {
        restaurantLat: 0,
        restaurantLng: 0,
        openingTime: "",
        closingTime: "",
      };
    }
    if (showRestaurantStep) {
      return {
        restaurantName: "",
        restaurantPhone: "",
        restaurantAddress: "",
        restaurantCity: "",
        restaurantState: "",
        restaurantZipCode: "",
        cuisineType: "",
      };
    }
    return {
      name: "",
      email: "",
      password: "",
      role: initialRole,
      phoneNumber: "",
      profilePicture: null,
    };
  }, [showRestaurantStep, showRestaurantLocationStep, initialRole]);

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

  const watchedRole = watch("role");

  useEffect(() => {
    setValue("role", role);
  }, [role, setValue]);

  useEffect(() => {
    if (showRestaurantLocationStep) {
      reset({
        restaurantLat: 0,
        restaurantLng: 0,
        openingTime: "",
        closingTime: "",
      });
    } else if (showRestaurantStep) {
      reset({
        restaurantName: "",
        restaurantPhone: "",
        restaurantAddress: "",
        restaurantCity: "",
        restaurantState: "",
        restaurantZipCode: "",
        cuisineType: "",
      });
    }
  }, [showRestaurantStep, showRestaurantLocationStep, reset]);

  useEffect(() => {
    if (!isLogin) {
      reset({
        name: "",
        email: "",
        password: "",
        role,
        profilePicture: null,
      });
      setImagePreview(null);
    }
  }, [isLogin, role, reset]);

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
    [setValue]
  );

  const removeImage = useCallback(() => {
    setValue("profilePicture", null);
    setImagePreview(null);
  }, [setValue]);

  const onSubmit = useCallback(
    async (data) => {
      if (isLogin) {
        await loginUser(data);
        return;
      }

      if (!showRestaurantStep && data.role === "seller") {
        setUserRegistrationData(data);
        setShowRestaurantStep(true);
        onRestaurantInfoStep?.(true);
        return;
      }

      if (
        showRestaurantStep &&
        !showRestaurantLocationStep &&
        userRegistrationData
      ) {
        setRestaurantInfoData(data);
        setShowRestaurantLocationStep(true);
        return;
      }

      if (
        showRestaurantLocationStep &&
        userRegistrationData &&
        restaurantInfoData
      ) {
        const mergedData = {
          ...userRegistrationData,
          ...restaurantInfoData,
          ...data,
        };

        const combinedData = new FormData();

        Object.keys(mergedData).forEach((key) => {
          if (key === "profilePicture" && mergedData[key] instanceof File) {
            combinedData.append(key, mergedData[key]);
          } else if (mergedData[key] != null) {
            combinedData.append(key, mergedData[key]);
          }
        });

        await registerUser(combinedData);
        setShowRestaurantStep(false);
        setShowRestaurantLocationStep(false);
        setUserRegistrationData(null);
        setRestaurantInfoData(null);
        return;
      }

      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === "profilePicture" && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (data[key] != null) {
          formData.append(key, data[key]);
        }
      });

      await registerUser(formData);
    },
    [
      isLogin,
      showRestaurantStep,
      showRestaurantLocationStep,
      userRegistrationData,
      restaurantInfoData,
      loginUser,
      registerUser,
      onRestaurantInfoStep,
    ]
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
    showRestaurantStep,
    setShowRestaurantStep,
    showRestaurantLocationStep,
    setShowRestaurantLocationStep,
    watch,
    setValue,
  };
}
