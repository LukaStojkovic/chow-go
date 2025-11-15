import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
});

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Min 6 characters"),
    role: z.enum(["customer", "owner"]),
    restaurantName: z.string().optional(),
    profileImage: z.any().optional(),
  })
  .refine((d) => d.role !== "owner" || d.restaurantName?.trim(), {
    message: "Restaurant name is required",
    path: ["restaurantName"],
  })
  .refine((d) => d.role !== "owner" || d.profileImage instanceof File, {
    message: "Profile image is required",
    path: ["profileImage"],
  });

export function useAuthForm(isLogin, initialRole = "customer") {
  const [role, setRole] = useState(initialRole);
  const [imagePreview, setImagePreview] = useState(null);

  const schema = isLogin ? loginSchema : registerSchema;

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
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: initialRole,
      restaurantName: "",
      profileImage: null,
    },
  });

  const watchedRole = watch("role");

  useEffect(() => {
    setValue("role", role);
  }, [role, setValue]);

  useEffect(() => {
    if (!isLogin) {
      reset({
        name: "",
        email: "",
        password: "",
        role,
        restaurantName: "",
        profileImage: null,
      });
      setImagePreview(null);
    }
  }, [isLogin, role, reset]);

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be under 5MB");

    setValue("profileImage", file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setValue("profileImage", null);
    setImagePreview(null);
  };

  const onSubmit = async (data) => {
    if (isLogin) {
      console.log("Login:", { email: data.email, password: data.password });
      return;
    }

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "profileImage" && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (data[key] != null) {
        formData.append(key, data[key]);
      }
    });

    console.log("Register:", Object.fromEntries(formData));
  };

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
  };
}
