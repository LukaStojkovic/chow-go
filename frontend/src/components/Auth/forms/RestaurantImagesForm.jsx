import { ImageUploadField } from "../fields/ImageUploadField";
import { useTranslation } from "react-i18next";

export function RestaurantImagesForm({ register, errors, setValue, control }) {
  const { t } = useTranslation("auth");
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          {t("restaurant.descriptionLabel")}
        </label>
        <textarea
          {...register("restaurantDescription")}
          placeholder={t("restaurant.descriptionPlaceholder")}
          className="w-full h-24 px-3 py-2 rounded-lg sm:rounded-xl bg-card/50 border border-border hover:border-primary focus:border-primary focus:ring-ring/20 transition-colors text-sm placeholder:text-muted-foreground resize-none"
        />
        {errors.restaurantDescription && (
          <p className="mt-1 text-sm text-destructive ">
            {errors.restaurantDescription.message}
          </p>
        )}
      </div>

      <ImageUploadField
        control={control}
        onImageChange={(files) => setValue("restaurantImages", files)}
        error={errors.restaurantImages}
        multiple={true}
        maxImages={10}
        label={t("restaurant.photosLabel", { min: 1, max: 10 })}
      />
    </div>
  );
}
