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
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EMPTY_PROMOTION, menuItemSchema } from "@chowgo/shared/menuItemSchema";
import { useCreateMenuItem } from "../hooks/useCreateMenuItem";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";
import { MenuItemImageUploader } from "./MenuItemImageUploader";
import { MenuItemPromotionFields } from "./MenuItemPromotionFields";

// The local list used to offer "burger", "salad" and "japanese" - values no
// `MenuItem.category` filter on the customer side matches, so a dish filed
// under any of them was unreachable from discovery. The shared taxonomy is the
// one list both sides agree on.

export const AddMenuItemForm = ({ onClose }) => {
  const { t, i18n } = useTranslation(["seller", "common"]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => categoryOptions(t), [i18n.language]);

  const [previews, setPreviews] = useState([]);
  const { createMenuItem, isCreating } = useCreateMenuItem();
  const { authUser } = useAuthStore();
  const restaurantId =
    authUser?.restaurant?._id || authUser?.restaurant?.[0]?._id;
  console.log(authUser);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      available: true,
      description: "",
      images: [],
      promotion: { ...EMPTY_PROMOTION },
    },
  });

  const images = watch("images") || [];

  const onSubmit = (data) => {
    if (restaurantId) {
      createMenuItem(
        { restaurantId, menuItemData: data },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <form
      className="space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide"
      onSubmit={handleSubmit(onSubmit)}
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
          <Select onValueChange={(value) => setValue("category", value)}>
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
            onCheckedChange={(checked) => setValue("available", checked)}
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
          rows={10}
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

      <MenuItemImageUploader
        {...{ images, setValue, previews, setPreviews, errors }}
      />

      <div className="flex justify-end gap-4 pt-8 border-t">
        <Button type="button" variant="outline" size="lg" onClick={onClose}>
          {t("common:actions.cancel")}
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isCreating}
          className="bg-primary hover:bg-primary px-8"
        >
          {isCreating ? <Spinner size="sm" /> : t("menu.addDish")}
        </Button>
      </div>
    </form>
  );
};
