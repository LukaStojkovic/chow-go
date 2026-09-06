import { FlatList, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { formatPrice } from "@chowgo/shared/format";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";
import { useTokens } from "@/theme/useTokens";

function FeeRow({ label, value, emphasis }) {
  return (
    <View className="flex-row justify-between">
      <Text variant={emphasis ? "label" : "body-sm"} tone={emphasis ? "foreground" : "muted"}>
        {label}
      </Text>
      <Text variant={emphasis ? "price" : "body-sm"} tone={emphasis ? "foreground" : "muted"}>
        {formatPrice(value)}
      </Text>
    </View>
  );
}

export default function Basket() {
  const { items, totalPrice, restaurant, updateItemQuantity, removeItem } = useCartStore();
  const { color } = useTokens();

  if (items.length === 0) {
    return (
      <Screen className="justify-center">
        <EmptyState
          title="Your basket is empty"
          description="Add something from a restaurant near you."
          actionLabel="Browse restaurants"
          onAction={() => router.replace("/(customer)/(tabs)")}
        />
      </Screen>
    );
  }

  // Fees come from the shared package, which mirrors the backend's own
  // constants - the client never invents a price.
  const breakdown = buildPriceBreakdown({ subtotal: totalPrice });

  return (
    <Screen edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.menuItem?._id ?? item.menuItem)}
        contentContainerClassName="pb-4"
        ListHeaderComponent={
          restaurant?.name ? (
            <Text variant="caption" tone="muted" className="px-5 pb-2 pt-3">
              From {restaurant.name}
            </Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View className="mx-5 h-px bg-border" />}
        renderItem={({ item }) => {
          const id = String(item.menuItem?._id ?? item.menuItem);
          return (
            <View className="gap-2 px-5 py-3">
              <View className="flex-row items-start justify-between gap-3">
                {item.menuItem?.imageUrls?.[0] ? (
                  <View className="h-14 w-14 overflow-hidden rounded-xs bg-muted">
                    <Image
                      source={item.menuItem.imageUrls[0]}
                      style={{ flex: 1 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                ) : null}
                <View className="flex-1 gap-0.5">
                  <Text variant="label" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text variant="body-sm" tone="muted">
                    {formatPrice(item.price)} each
                  </Text>
                  {item.specialInstructions ? (
                    <Text variant="caption" tone="muted" numberOfLines={2}>
                      {item.specialInstructions}
                    </Text>
                  ) : null}
                </View>
                <Text variant="price">{formatPrice(item.price * item.quantity)}</Text>
              </View>

              <View className="flex-row items-center gap-3">
                <Stepper
                  value={item.quantity}
                  min={1}
                  onChange={(next) => updateItemQuantity(id, next, item.specialInstructions)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  haptic={false}
                  accessibilityLabel={`Remove ${item.name}`}
                  onPress={() => removeItem(id)}
                >
                  <Trash2 size={16} color={color["muted-foreground"]} />
                </Button>
              </View>
            </View>
          );
        }}
      />

      <View className="gap-3 border-t border-border bg-card p-4">
        <View className="gap-1.5">
          <FeeRow label="Subtotal" value={breakdown.subtotal} />
          <FeeRow label="Delivery" value={breakdown.deliveryFee} />
          <FeeRow label="Service" value={breakdown.serviceFee} />
          <View className="h-px bg-border" />
          <FeeRow label="Total" value={breakdown.total} emphasis />
        </View>
        <Button size="lg" onPress={() => router.push("/(customer)/checkout")}>
          Go to checkout
        </Button>
      </View>
    </Screen>
  );
}
