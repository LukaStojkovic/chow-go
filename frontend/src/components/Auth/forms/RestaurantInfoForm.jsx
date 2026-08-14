import { motion } from "framer-motion";
import { InputField } from "../fields/InputField";
import { cuisineOptions } from "@/lib/constants";

export function RestaurantInfoForm({ register, errors }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <InputField
        register={register("restaurantName")}
        placeholder="Restaurant Name"
        error={errors.restaurantName}
      />
      <InputField
        register={register("restaurantPhone")}
        placeholder="Phone Number"
        error={errors.restaurantPhone}
      />
      <InputField
        register={register("restaurantAddress")}
        placeholder="Restaurant Address"
        error={errors.restaurantAddress}
      />
      <InputField
        register={register("restaurantCity")}
        placeholder="City"
        error={errors.restaurantCity}
      />
      <InputField
        register={register("restaurantState")}
        placeholder="State/Province"
        error={errors.restaurantState}
      />
      <InputField
        register={register("restaurantZipCode")}
        placeholder="Zip Code"
        error={errors.restaurantZipCode}
      />
      <select
        {...register("cuisineType", {
          required: "Cuisine type is required",
        })}
        className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 px-3 text-sm focus:border-emerald-500 focus:ring-emerald-500/20"
      >
        <option value="">Select cuisine type</option>

        {cuisineOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </motion.div>
  );
}
