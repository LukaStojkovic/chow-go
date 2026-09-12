import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { categoryOptions } from "@chowgo/shared/constants";
import { formatPrice } from "@chowgo/shared/format";
import { EMPTY_PROMOTION, editMenuItemSchema, menuItemSchema } from "@chowgo/shared/menuItemSchema";
import { PROMOTION_LIMITS, previewPromotion, promotionTypes } from "@chowgo/shared/promotion";
import { errorMessage } from "@/api/client";
import { Trash2 } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { MenuItemImages } from "@/features/seller/MenuItemImages";
import {
  useCreateMenuItem,
  useDeleteMenuItem,
  useMenuItems,
  useUpdateMenuItem,
} from "@/hooks/Restaurants/useMenuItems";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

export default function MenuItemForm() {
  const { menuItemId } = useLocalSearchParams();
  const isNew = menuItemId === "new";
  const { color } = useTokens();
  const { t, i18n } = useTranslation(["seller", "common", "validation"]);
  const categories = useMemo(() => categoryOptions(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const promoTypes = useMemo(() => promotionTypes(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useCreateMenuItem();
  const update = useUpdateMenuItem();
  const remove = useDeleteMenuItem();

  // Read from the list the seller just came from: the API exposes no
  // single-menu-item endpoint for the owner.
  const { data } = useMenuItems({ limit: 50 });
  const existingItem = isNew
    ? null
    : (data?.menuItems ?? []).find((entry) => String(entry._id) === String(menuItemId));

  const { control, handleSubmit, watch, setValue, reset, formState } = useForm({
    resolver: zodResolver(isNew ? menuItemSchema : editMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: "",
      available: true,
      images: [],
      existingImages: [],
      promotion: EMPTY_PROMOTION,
    },
  });

  const addedImages = watch("images") ?? [];
  const existingImages = watch("existingImages") ?? [];

  useEffect(() => {
    if (!existingItem) return;
    reset({
      name: existingItem.name ?? "",
      description: existingItem.description ?? "",
      category: existingItem.category ?? "",
      price: String(existingItem.price ?? ""),
      available: existingItem.available !== false,
      images: [],
      existingImages: existingItem.imageUrls ?? [],
      promotion: { ...EMPTY_PROMOTION, ...(existingItem.promotion ?? {}) },
    });
  }, [existingItem, reset]);

  const price = watch("price");
  const promotion = watch("promotion");
  const preview = previewPromotion(Number(price) || 0, promotion);

  async function onSubmit(values) {
    try {
      if (isNew) {
        await create.mutateAsync(values);
        toast.success("Dish added");
      } else {
        await update.mutateAsync({ menuItemId, ...values });
        toast.success("Dish updated");
      }
      router.back();
    } catch (error) {
      toast.error("Could not save the dish", { description: errorMessage(error) });
    }
  }

  const busy = create.isPending || update.isPending;

  // The backend refuses to update a dish with no images, so an edit that
  // removed the last one would 400. Create is checked by the schema.
  const hasImage = existingImages.length + addedImages.length > 0;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        title={isNew ? "Add a dish" : "Edit dish"}
        subtitle={isNew ? undefined : existingItem?.name}
      />

      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              The dish
            </Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Input
                label="Name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={formState.errors.name?.message}
                placeholder="Margherita Pizza"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Input
                label="Description"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={formState.errors.description?.message}
                placeholder="What is in it?"
                multiline
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <View className="gap-2">
                <Text variant="label-sm" tone={formState.errors.category ? "destructive" : "muted"}>
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.filter((entry) => entry.id !== "all").map((entry) => (
                    <Chip
                      key={entry.id}
                      label={entry.label}
                      active={field.value === entry.value}
                      showCheck
                      onPress={() => field.onChange(entry.value)}
                    />
                  ))}
                </View>
                {formState.errors.category ? (
                  <Text variant="caption" tone="destructive">
                    {formState.errors.category.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <Input
                label="Price"
                value={String(field.value ?? "")}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={formState.errors.price?.message}
                keyboardType="decimal-pad"
                placeholder="9.99"
              />
            )}
          />
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              Photos
            </Text>
          </View>

          <MenuItemImages
            existing={existingImages}
            added={addedImages}
            error={formState.errors.images?.message}
            onChangeExisting={(next) => setValue("existingImages", next, { shouldValidate: true })}
            onChangeAdded={(next) => setValue("images", next, { shouldValidate: true })}
          />
        </Card>

        <Controller
          control={control}
          name="available"
          render={({ field }) => (
            <Card className="flex-row items-center gap-3">
              <View className="flex-1 gap-0.5 pr-3">
                <Text variant="h3">Available to order</Text>
                <Text variant="caption" tone="muted">
                  Hidden dishes stay on your menu but cannot be ordered.
                </Text>
              </View>
              <Toggle
                value={field.value}
                onValueChange={field.onChange}
                accessibilityLabel="Available to order"
              />
            </Card>
          )}
        />

        <Card className="gap-4">
          <Controller
            control={control}
            name="promotion.isActive"
            render={({ field }) => (
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text variant="h3">Run a promotion</Text>
                  <Text variant="caption" tone="muted">
                    Mark this dish down for a while
                  </Text>
                </View>
                <Toggle
                  value={field.value}
                  onValueChange={field.onChange}
                  accessibilityLabel="Run a promotion"
                />
              </View>
            )}
          />

          {promotion?.isActive ? (
            <>
              <Controller
                control={control}
                name="promotion.type"
                render={({ field }) => (
                  <View className="flex-row gap-2">
                    {promoTypes.map((entry) => (
                      <Chip
                        key={entry.value}
                        label={entry.label}
                        active={field.value === entry.value}
                        onPress={() => field.onChange(entry.value)}
                        className="flex-1 justify-center"
                      />
                    ))}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="promotion.value"
                render={({ field }) => (
                  <Input
                    label={promotion.type === "fixed" ? "Amount off" : "Percent off"}
                    value={String(field.value ?? "")}
                    onChangeText={field.onChange}
                    keyboardType="decimal-pad"
                    error={formState.errors.promotion?.value?.message}
                    hint={
                      promotion.type === "fixed"
                        ? `Cannot price the dish below ${formatPrice(PROMOTION_LIMITS.minPrice)}`
                        : `Up to ${PROMOTION_LIMITS.maxPercentOff}% off`
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="promotion.label"
                render={({ field }) => (
                  <Input
                    label="Label"
                    value={field.value ?? ""}
                    onChangeText={field.onChange}
                    maxLength={PROMOTION_LIMITS.maxLabelLength}
                    placeholder="Lunch deal"
                    error={formState.errors.promotion?.label?.message}
                  />
                )}
              />

              {/* The same rules the server applies, so a deal it would reject is
                visible before saving rather than after. */}
              <Inset tone="mint" className="gap-1">
                <Text variant="caption" tone="primary">
                  What customers will see
                </Text>
                {preview.isValid ? (
                  <View className="flex-row items-baseline gap-2">
                    <Text variant="price-lg" tone="primary">
                      {formatPrice(preview.discounted)}
                    </Text>
                    <Text variant="body-sm" tone="muted" className="line-through">
                      {formatPrice(Number(price) || 0)}
                    </Text>
                    <Text variant="label-sm" tone="primary">
                      {preview.percentOff}% off · saving {formatPrice(preview.saving)}
                    </Text>
                  </View>
                ) : (
                  <Text variant="body-sm" tone="muted">
                    Enter a price and a discount to preview it.
                  </Text>
                )}
              </Inset>
            </>
          ) : null}
        </Card>

        {!isNew ? (
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            className="mt-1"
            loading={remove.isPending}
            onPress={async () => {
              try {
                await remove.mutateAsync(menuItemId);
                toast.info("Dish deleted");
                router.back();
              } catch (error) {
                toast.error("Could not delete", { description: errorMessage(error) });
              }
            }}
          >
            <View className="flex-row items-center gap-2">
              <Trash2 size={17} color={color.destructive} />
              <Text variant="label" tone="destructive">
                Delete dish
              </Text>
            </View>
          </Button>
        ) : null}
      </ScrollView>

      <DockedBar>
        {!hasImage ? (
          <Text variant="caption" tone="muted" className="text-center">
            Add at least one photo to save.
          </Text>
        ) : null}
        <Button
          size="lg"
          fullWidth
          loading={busy}
          disabled={!hasImage}
          onPress={handleSubmit(onSubmit)}
        >
          {isNew ? "Add dish" : "Save changes"}
        </Button>
      </DockedBar>
    </Screen>
  );
}
