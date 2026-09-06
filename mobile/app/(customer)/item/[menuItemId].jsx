import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { toDishViews } from "@chowgo/shared/adapters/menu";
import { formatPrice } from "@chowgo/shared/format";
import { MAX_ORDER_NOTES } from "@chowgo/shared/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";

export default function ItemCustomization() {
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
      toast.info("Your basket has items from another restaurant");
    }
  }

  if (!dish) {
    return (
      <Screen className="items-center justify-center p-8">
        <Text variant="body" tone="muted">
          This item is no longer available.
        </Text>
      </Screen>
    );
  }

  const total = dish.price * quantity;

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-5 pb-6" keyboardShouldPersistTaps="handled">
        {dish.image ? (
          <View className="aspect-[16/10] bg-muted">
            <Image source={dish.image} style={{ flex: 1 }} contentFit="cover" transition={500} />
          </View>
        ) : null}

        <View className="gap-2 px-5">
          <Text variant="h1">{dish.name}</Text>
          {dish.description ? (
            <Text variant="body" tone="muted">
              {dish.description}
            </Text>
          ) : null}
          <View className="flex-row items-baseline gap-2">
            <Text variant="price-lg">{formatPrice(dish.price)}</Text>
            {dish.basePrice ? (
              <Text variant="body-sm" tone="muted" className="line-through">
                {formatPrice(dish.basePrice)}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="px-5">
          <Input
            label="Special instructions"
            hint="Optional — allergies, preferences, anything the kitchen should know."
            value={notes}
            onChangeText={setNotes}
            maxLength={MAX_ORDER_NOTES}
            multiline
            className="h-24 py-3"
            style={{ textAlignVertical: "top" }}
          />
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-border bg-card p-4">
        <Stepper value={quantity} onChange={setQuantity} />
        <Button className="flex-1" size="lg" loading={busy} onPress={add}>
          {`Add to basket · ${formatPrice(total)}`}
        </Button>
      </View>
    </Screen>
  );
}
