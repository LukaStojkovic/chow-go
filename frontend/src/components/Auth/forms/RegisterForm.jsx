import { motion } from "framer-motion";
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 rounded-full text-slate-300">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleButton />
    </motion.div>
  );
}
