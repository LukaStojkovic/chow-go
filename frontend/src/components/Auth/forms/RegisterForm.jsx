import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { InputField } from "../fields/InputField";
import { ImageUploadField } from "../fields/ImageUploadField";
import { RoleSelector } from "./RoleSelector";
import { GoogleButton } from "./GoogleButton";

export function RegisterForm({
  register,
  control,
  errors,
  role,
  setRole,
  imagePreview,
  handleImageChange,
  removeImage,
  watchedRole,
}) {
  const { t } = useTranslation("auth");
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <RoleSelector role={role} setRole={setRole} />

      <ImageUploadField
        control={control}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onRemove={removeImage}
        error={errors.profilePicture}
        required={watchedRole === "seller"}
      />

      <InputField
        register={register("name")}
        placeholder={t("fields.fullName")}
        error={errors.name}
      />
      <InputField
        register={register("email")}
        type="email"
        placeholder={t("fields.email")}
        error={errors.email}
      />
      {watchedRole === "customer" && (
        <InputField
          register={register("phoneNumber")}
          type="tel"
          placeholder={t("fields.phone")}
          error={errors.phoneNumber}
        />
      )}
      <InputField
        register={register("password")}
        type="password"
        placeholder={t("fields.passwordWithMin", { count: 6 })}
        error={errors.password}
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border "></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card rounded-full text-muted-foreground">
            {t("login.orContinueWith")}
          </span>
        </div>
      </div>

      <GoogleButton />
    </motion.div>
  );
}
