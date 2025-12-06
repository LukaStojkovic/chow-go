import { motion } from "framer-motion";
import { InputField } from "../fields/InputField";

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
      <InputField
        register={register("cuisineType")}
        placeholder="Cuisine Type (e.g., Italian, Chinese, Fast Food)"
        error={errors.cuisineType}
      />
    </motion.div>
  );
}
