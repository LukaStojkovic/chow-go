import { ImageUploadField } from "../fields/ImageUploadField";

export function RestaurantImagesForm({ register, errors, setValue, control }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Restaurant Description
        </label>
        <textarea
          {...register("restaurantDescription")}
          placeholder="Describe your restaurant (at least 10 characters)"
          className="w-full h-24 px-3 py-2 rounded-lg sm:rounded-xl bg-white/50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20 transition-colors text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
        />
        {errors.restaurantDescription && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
