import { ImageUploadField } from "../fields/ImageUploadField";

export function RestaurantImagesForm({ register, errors, setValue, control }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Restaurant Description
        </label>
        <textarea
          {...register("restaurantDescription")}
          placeholder="Describe your restaurant (at least 10 characters)"
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
        label="Restaurant Photos (1-10 images)"
      />
    </div>
  );
}
