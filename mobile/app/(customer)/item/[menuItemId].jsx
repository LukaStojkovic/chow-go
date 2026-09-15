import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { UtensilsCrossed } from "lucide-react-native";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { formatPrice } from "@chowgo/shared/format";
import { MAX_ORDER_NOTES } from "@chowgo/shared/constants";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";

export default function ItemCustomization() {
  const { t } = useTranslation(["order", "restaurant", "basket", "profile", "auth", "errors", "validation", "courier", "common"]);
  const { menuItemId, restaurantId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Read from the menu the restaurant page already loaded rather than
  // refetching a single item the API has no endpoint for.
  const dish = useMemo(() => {
    const menu = queryClient.getQueryData(["restaurantMenu", restaurantId]) ?? [];
    const all = toDishViews(menu.flatMap((group) => group.items ?? []));
    return all.find((item) => item.id === menuItemId) ?? null;
  }, [queryClient, restaurantId, menuItemId]);

  async function add() {
    setBusy(true);
    const result = await addItem(menuItemId, quantity, notes.trim() || undefined);
    setBusy(false);

    if (result.status === "added") {
      router.back();
      return;
    }
    if (result.status === "unauthenticated") {
      router.push("/(auth)/login");
      return;
    }
    if (result.status === "conflict") {
      router.back();
      // The dialog lives above the tab bar so it survives this sheet closing.
      toast.info(t("basket:heading"));
    }
  }

  if (!dish) {
    return (
      <Screen>
        <ScreenHeader />
        <EmptyState
          icon={UtensilsCrossed}
          title={t("restaurant:menu.soldOut")}
          description={t("errors:cart.menuItemNotFound")}
          actionLabel={t("common:actions.goBack")}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const total = dish.price * quantity;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView
        contentContainerClassName="pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="aspect-[16/10] bg-muted">
          {dish.image ? (
            <Image source={dish.image} style={{ flex: 1 }} contentFit="cover" transition={500} />
          ) : null}

          {dish.discountPercent > 0 ? (
            <View className="absolute left-5 top-5">
              <Badge tone="solid-citrus">{dish.promoLabel ?? `${dish.discountPercent}% off`}</Badge>
            </View>
          ) : null}
        </View>

        {/* The white sheet lifts over the photograph, the same move the
             restaurant hero makes, so the two screens feel continuous. */}
        <View className="-mt-6 gap-5 rounded-t-3xl bg-background px-5 pt-6">
          <View className="gap-2">
            <Text variant="h1">{dish.name}</Text>
            {dish.description ? (
              <Text variant="body-lg" tone="muted">
                {dish.description}
              </Text>
            ) : null}
            <View className="flex-row items-baseline gap-2 pt-1">
              <Text variant="price-lg" tone="primary">
                {formatPrice(dish.price)}
              </Text>
              {dish.basePrice ? (
                <Text variant="body" tone="muted" className="line-through">
                  {formatPrice(dish.basePrice)}
                </Text>
              ) : null}
            </View>
          </View>

          <Input
            label={t("basket:line.instructions")}
            hint={t("basket:kitchenNoteHint")}
            value={notes}
            onChangeText={setNotes}
            maxLength={MAX_ORDER_NOTES}
            multiline
            placeholder={t("basket:kitchenNoteShortPlaceholder")}
          />
        </View>
      </ScrollView>

      <DockedBar className="flex-row items-center gap-3">
        <Stepper value={quantity} onChange={setQuantity} />
        <Button className="flex-1" size="lg" loading={busy} onPress={add}>
          {t("basket:addItem", { price: formatPrice(total) })}
        </Button>
      </DockedBar>
    </Screen>
  );
}
