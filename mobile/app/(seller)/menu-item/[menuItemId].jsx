import { useEffect, useState } from "react";
import { ScrollView, Switch, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { CATEGORIES } from "@chowgo/shared/constants";
import { formatPrice } from "@chowgo/shared/format";
import { EMPTY_PROMOTION, editMenuItemSchema, menuItemSchema } from "@chowgo/shared/menuItemSchema";
import { PROMOTION_LIMITS, PROMOTION_TYPES, previewPromotion } from "@chowgo/shared/promotion";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
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
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-5 p-5 pb-8" keyboardShouldPersistTaps="handled">
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
              className="h-20 py-3"
              style={{ textAlignVertical: "top" }}
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <View className="gap-2">
              <Text variant="label" tone={formState.errors.category ? "destructive" : "foreground"}>
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.filter((entry) => entry.id !== "all").map((entry) => (
                  <Button
                    key={entry.id}
                    size="sm"
                    variant={field.value === entry.value ? "primary" : "outline"}
                    onPress={() => field.onChange(entry.value)}
                  >
                    {entry.label}
                  </Button>
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

        <MenuItemImages
          existing={existingImages}
          added={addedImages}
          error={formState.errors.images?.message}
          onChangeExisting={(next) => setValue("existingImages", next, { shouldValidate: true })}
          onChangeAdded={(next) => setValue("images", next, { shouldValidate: true })}
        />

        <Controller
          control={control}
          name="available"
          render={({ field }) => (
            <View className="flex-row items-center justify-between rounded-md border border-border bg-card p-4">
              <View className="flex-1 gap-0.5 pr-3">
                <Text variant="label">Available</Text>
                <Text variant="caption" tone="muted">
                  Hidden dishes stay on your menu but cannot be ordered.
                </Text>
              </View>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ true: color.primary, false: color.border }}
              />
            </View>
          )}
        />

        <View className="gap-3 rounded-md border border-border bg-card p-4">
          <Controller
            control={control}
            name="promotion.isActive"
            render={({ field }) => (
              <View className="flex-row items-center justify-between">
                <Text variant="label">Run a promotion</Text>
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ true: color.primary, false: color.border }}
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
                    {PROMOTION_TYPES.map((entry) => (
                      <Button
                        key={entry.value}
                        size="sm"
                        className="flex-1"
                        variant={field.value === entry.value ? "primary" : "outline"}
                        onPress={() => field.onChange(entry.value)}
                      >
                        {entry.label}
                      </Button>
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
              <View className="rounded-sm bg-primary-subtle p-3">
                {preview.isValid ? (
                  <View className="flex-row items-baseline gap-2">
                    <Text variant="caption" className="text-primary-subtle-foreground">
                      Customers pay
                    </Text>
                    <Text variant="price" className="text-primary-subtle-foreground">
                      {formatPrice(preview.discounted)}
                    </Text>
                    <Text variant="caption" className="text-primary-subtle-foreground">
                      ({preview.percentOff}% off, saving {formatPrice(preview.saving)})
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption" tone="muted">
                    Enter a price and a discount to preview it.
                  </Text>
                )}
              </View>
            </>
          ) : null}
        </View>

        {!isNew ? (
          <Button
            variant="ghost"
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
            <Text variant="label" tone="destructive">
              Delete dish
            </Text>
          </Button>
        ) : null}
      </ScrollView>

      <View className="border-t border-border bg-card p-4">
        {!hasImage ? (
          <Text variant="caption" tone="muted" className="pb-2 text-center">
            Add at least one photo to save.
          </Text>
        ) : null}
        <Button size="lg" loading={busy} disabled={!hasImage} onPress={handleSubmit(onSubmit)}>
          {isNew ? "Add dish" : "Save changes"}
        </Button>
      </View>
    </Screen>
  );
}
