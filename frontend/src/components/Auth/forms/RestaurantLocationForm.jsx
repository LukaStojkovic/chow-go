import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { LocationMapSelector } from "@/components/Location/LocationMapSelector";
import { InputField } from "../fields/InputField";
import { useCallback } from "react";

export function RestaurantLocationForm({ register, errors, setValue }) {
  const handleLocationChange = useCallback(
    (lat, lng) => {
      setValue("restaurantLat", lat, { shouldDirty: true });
      setValue("restaurantLng", lng, { shouldDirty: true });
    },
    [setValue]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Select Restaurant Location
        </label>

        <LocationMapSelector onLocationChange={handleLocationChange} />

        {errors.restaurantLat && (
          <p className="text-xs text-red-500">{errors.restaurantLat.message}</p>
        )}
      </div>

      <div className="space-y-3 border-t border-gray-200 dark:border-zinc-800 pt-5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          Operating Hours
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <InputField
              register={register("openingTime")}
              type="time"
              placeholder="Opening Time"
              error={errors.openingTime}
            />
            {errors.openingTime && (
              <p className="text-xs text-red-500 mt-1">
                {errors.openingTime.message}
              </p>
            )}
          </div>
          <div>
            <InputField
              register={register("closingTime")}
              type="time"
              placeholder="Closing Time"
              error={errors.closingTime}
            />
            {errors.closingTime && (
              <p className="text-xs text-red-500 mt-1">
                {errors.closingTime.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
