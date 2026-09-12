import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { InputField } from "../fields/InputField";
import { useCuisineOptions } from "@/lib/constants";

export function RestaurantInfoForm({ register, errors }) {
  const { t } = useTranslation(["auth", "validation"]);
  const cuisineOptions = useCuisineOptions();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <InputField
        register={register("restaurantName")}
        placeholder={t("auth:restaurant.namePlaceholder")}
        error={errors.restaurantName}
      />
      <InputField
        register={register("restaurantPhone")}
        placeholder={t("auth:restaurant.phonePlaceholder")}
        error={errors.restaurantPhone}
      />
      <InputField
        register={register("restaurantAddress")}
        placeholder={t("auth:restaurant.addressPlaceholder")}
        error={errors.restaurantAddress}
      />
      <InputField
        register={register("restaurantCity")}
        placeholder={t("auth:restaurant.cityPlaceholder")}
        error={errors.restaurantCity}
      />
      <InputField
        register={register("restaurantState")}
        placeholder={t("auth:restaurant.statePlaceholder")}
        error={errors.restaurantState}
      />
      <InputField
        register={register("restaurantZipCode")}
        placeholder={t("auth:restaurant.zipPlaceholder")}
        error={errors.restaurantZipCode}
      />
      <select
        {...register("cuisineType", {
          required: t("validation:restaurant.cuisineRequired"),
        })}
        className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl bg-card/50 border border-border px-3 text-sm focus:border-primary focus:ring-ring/20"
      >
        <option value="">{t("auth:restaurant.cuisinePlaceholder")}</option>

        {cuisineOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </motion.div>
  );
}
