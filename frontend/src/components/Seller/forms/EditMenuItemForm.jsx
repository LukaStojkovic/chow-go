import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { categoryOptions } from "@chowgo/shared/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editMenuItemSchema,
  promotionToFormValues,
} from "@chowgo/shared/menuItemSchema";
import { useUpdateMenuItem } from "../hooks/useUpdateMenuItem";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";
import { MenuItemImageUploader } from "./MenuItemImageUploader";
import { MenuItemPromotionFields } from "./MenuItemPromotionFields";
import { X } from "lucide-react";

export const EditMenuItemForm = ({ menuItem, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation(["seller", "common"]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => categoryOptions(t), [i18n.language]);

  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const { updateMenuItem, isUpdating } = useUpdateMenuItem();
  const { authUser } = useAuthStore();
  const restaurantId = authUser?.restaurant?._id || authUser?.restaurant?.[0]?._id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(editMenuItemSchema),
    defaultValues: {
      name: menuItem?.name || "",
      category: menuItem?.category || "",
      price: menuItem?.price?.toString() || "",
      available: menuItem?.available ?? true,
      description: menuItem?.description || "",
      images: [],
      existingImages: menuItem?.imageUrls || [],
      promotion: promotionToFormValues(menuItem?.promotion),
    },
  });

  useEffect(() => {
    if (menuItem) {
      setValue("name", menuItem.name || "");
      setValue("category", menuItem.category || "");
      setValue("price", menuItem.price?.toString() || "");
      setValue("available", menuItem.available ?? true);
      setValue("description", menuItem.description || "");
      setValue("promotion", promotionToFormValues(menuItem.promotion));

      const urls = Array.isArray(menuItem.imageUrls)
        ? menuItem.imageUrls
        : menuItem.imageUrls
        ? [menuItem.imageUrls]
        : [];

      setExistingImages(urls);
      setValue("existingImages", urls);
    }
  }, [menuItem, setValue]);

  const newImages = watch("images") || [];

  const removeExistingImage = (index) => {
    const updated = existingImages.filter((_, i) => i !== index);
    setExistingImages(updated);
    setValue("existingImages", updated, { shouldValidate: true });
  };

  const onSubmit = (data) => {
    if (!restaurantId || !menuItem) return;

    const menuItemData = {
      ...data,
      existingImages: existingImages,
    };

    updateMenuItem(
      { restaurantId, menuItemId: menuItem._id, menuItemData },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide"
    >
      <div className="space-y-7">
        <div>
          <Label htmlFor="name">{t("menu.form.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("menu.form.namePlaceholder")}
            className="mt-2 h-12"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">{t("menu.form.categoryLabel")}</Label>
          <Select
            value={watch("category")}
            onValueChange={(v) => setValue("category", v)}
          >
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder={t("menu.form.categoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((entry) => entry.id !== "all")
                .map((entry) => (
                  <SelectItem key={entry.id} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="price">{t("menu.form.priceLabel")}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="14.99"
            className="mt-2 h-12"
            {...register("price")}
          />
          {errors.price && (
            <p className="text-sm text-destructive mt-1">
              {errors.price.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <Switch
            id="available"
            checked={watch("available")}
            onCheckedChange={(c) => setValue("available", c)}
          />
          <Label htmlFor="available" className="cursor-pointer">
            {t("menu.form.availableLabel")}
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="description">{t("menu.form.descriptionLabel")}</Label>
        <Textarea
          id="description"
          placeholder={t("menu.form.descriptionPlaceholder")}
          rows={6}
          className="mt-2 resize-none"
          {...register("description")}
        />
      </div>

      <MenuItemPromotionFields
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />

      <div className="space-y-6">
        <div>
          <Label>{t("menu.form.currentImages")}</Label>
          {existingImages.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {existingImages.map((url, index) => (
                <div
                  key={url}
                  className="relative group aspect-square rounded-lg overflow-hidden border shadow-sm"
                >
                  <img
                    src={url}
                    alt={`${t("settings.currentDishImage")} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t("menu.form.removeImage")}
                  >
                    <X className="w-8 h-8 text-white" strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              {t("menu.form.noImages")}
            </p>
          )}
        </div>

        <div>
          <Label>{t("menu.form.addImages")}</Label>
          <MenuItemImageUploader
            images={newImages}
            setValue={setValue}
            previews={previews}
            setPreviews={setPreviews}
            errors={errors}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t">
        <Button type="button" variant="outline" size="lg" onClick={onClose}>
          {t("common:actions.cancel")}
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isUpdating}
          className="bg-primary hover:bg-primary px-8"
        >
          {isUpdating ? <Spinner size="sm" /> : t("settings.updateMenuItem")}
        </Button>
      </div>
    </form>
  );
};
