import { motion } from "framer-motion";
import { InputField } from "../fields/InputField";
import { ImageUploadField } from "../fields/ImageUploadField";
import { RoleSelector } from "./RoleSelector";

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
        placeholder="Full Name"
        error={errors.name}
      />
      <InputField
        register={register("email")}
        type="email"
        placeholder="Email"
        error={errors.email}
      />
      {watchedRole === "customer" && (
        <InputField
          register={register("phoneNumber")}
          type="tel"
          placeholder="Phone number"
          error={errors.phoneNumber}
        />
      )}
      <InputField
        register={register("password")}
        type="password"
        placeholder="Password (min 6 characters)"
        error={errors.password}
      />
    </motion.div>
  );
}
