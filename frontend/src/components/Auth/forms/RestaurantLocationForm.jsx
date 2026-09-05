import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { lazyNamed } from "@/lib/lazyNamed";
import { InputField } from "../fields/InputField";
import { Suspense, useCallback } from "react";

const LocationMapSelector = lazyNamed(
  () => import("@/components/Location/LocationMapSelector"),
  "LocationMapSelector",
);
import { TimePicker } from "@/components/ui/TimePicker";

export function RestaurantLocationForm({ register, errors, setValue, watch }) {
  const handleLocationChange = useCallback(
    (lat, lng) => {
      setValue("restaurantLat", lat, { shouldDirty: true });
      setValue("restaurantLng", lng, { shouldDirty: true });
    },
    [setValue],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground ">
          <MapPin className="w-4 h-4 text-primary" />
          Select Restaurant Location
        </label>

        <Suspense
          fallback={
            <div className="h-80 w-full animate-pulse rounded-lg border border-border bg-muted" />
          }
        >
          <LocationMapSelector onLocationChange={handleLocationChange} />
        </Suspense>

        {errors.restaurantLat && (
          <p className="text-xs text-destructive">{errors.restaurantLat.message}</p>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-5">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground ">
          <Clock className="w-4 h-4 text-primary" />
          Operating Hours
        </label>
        <div className=" flex-col flex grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Opening time
            </label>
            <TimePicker
              value={watch ? watch("openingTime") : ""}
              onChange={(val) =>
                setValue("openingTime", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {errors.openingTime && (
              <p className="text-xs text-destructive mt-1">
                {errors.openingTime.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Closing time
            </label>
            <TimePicker
              value={watch ? watch("closingTime") : ""}
              onChange={(val) =>
                setValue("closingTime", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {errors.closingTime && (
              <p className="text-xs text-destructive mt-1">
                {errors.closingTime.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
