import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { InputField } from "../fields/InputField";

export function RestaurantLocationForm({ register, errors, watch, setValue }) {
  const restaurantLat = watch("restaurantLat");
  const restaurantLng = watch("restaurantLng");

  const handleMapClick = () => {
    setValue("restaurantLat", 20.5937);
    setValue("restaurantLng", 78.9629);
  };

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
        <button
          type="button"
          onClick={handleMapClick}
          className="w-full h-80 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Map will be implemented here - Click to select location
            </p>
          </div>
        </button>
        {errors.restaurantLat && (
          <p className="text-xs text-red-500">{errors.restaurantLat.message}</p>
        )}
        {restaurantLat &&
          restaurantLng &&
          restaurantLat !== 0 &&
          restaurantLng !== 0 && (
            <p className="text-xs text-emerald-600">
              Location selected: {restaurantLat.toFixed(4)},{" "}
              {restaurantLng.toFixed(4)}
            </p>
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
