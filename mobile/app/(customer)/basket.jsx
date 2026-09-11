import { FlatList, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowRight, Plus, ShoppingBag } from "lucide-react-native";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { formatFee, formatPrice } from "@chowgo/shared/format";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Divider } from "@/components/ui/Section";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";
import { useTokens } from "@/theme/useTokens";

function FeeRow({ label, value, tone = "muted", strong = false }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        variant={strong ? "h3" : "body"}
        tone={strong ? "foreground" : "muted"}
        numberOfLines={1}
        className="flex-1"
      >
        {label}
      </Text>
      <Text variant={strong ? "price-lg" : "price"} tone={strong ? "foreground" : tone}>
        {typeof value === "string" ? value : formatPrice(value)}
      </Text>
    </View>
  );
}

export default function Basket() {
  const { items, totalPrice, restaurant, updateItemQuantity, removeItem } = useCartStore();
  const { color } = useTokens();

  if (items.length === 0) {
    return (
      <Screen>
        <ScreenHeader title="Your basket" />
        <EmptyState
          icon={ShoppingBag}
          title="Your basket is empty"
          description="Add something from a restaurant near you and it will show up here."
          actionLabel="Browse restaurants"
          onAction={() => router.replace("/(customer)/(tabs)")}
        />
      </Screen>
    );
  }

  // Fees come from the shared package, which mirrors the backend's own
  // constants - the client never invents a price.
  const breakdown = buildPriceBreakdown({ subtotal: totalPrice });
  const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="Your basket" subtitle={restaurant?.name} />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.menuItem?._id ?? item.menuItem)}
        contentContainerClassName="gap-3 px-5 pb-6"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text variant="h3">Estimated delivery</Text>
                  <Text variant="body-sm" tone="muted">
                    {restaurant?.estimatedDeliveryTime ?? "30-45 min"}
                  </Text>
                </View>
                <Badge tone="mint">{formatFee(breakdown.deliveryFee)}</Badge>
              </View>

              {restaurant?.name ? (
                <>
                  <Divider />
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1">
                      <Text variant="caption" tone="muted">
                        Ordering from
                      </Text>
                      <Text variant="h3" numberOfLines={1}>
                        {restaurant.name}
                      </Text>
                    </View>
                    <IconButton
                      icon={Plus}
                      variant="mint"
                      label="Add more items"
                      onPress={() =>
                        router.push(`/(customer)/restaurant/${restaurant._id ?? restaurant.id}`)
                      }
                    />
                  </View>
                </>
              ) : null}
            </Card>

            <View className="flex-row items-center justify-between pt-1">
              <Text variant="h1">Items</Text>
              <Text variant="label-sm" tone="muted">
                {count} {count === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const id = String(item.menuItem?._id ?? item.menuItem);
          return (
            <Card className="gap-3">
              <View className="flex-row items-start gap-3">
                <View className="h-16 w-16 overflow-hidden rounded-sm bg-muted">
                  {item.menuItem?.imageUrls?.[0] ? (
                    <Image
                      source={item.menuItem.imageUrls[0]}
                      style={{ flex: 1 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : null}
                </View>

                <View className="flex-1 gap-0.5">
                  <Text variant="h3" numberOfLines={2}>
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

              <View className="flex-row items-center justify-between">
                <Text variant="label-sm" tone="muted">
                  Quantity
                </Text>
                <Stepper
                  value={item.quantity}
                  min={1}
                  onChange={(next) => updateItemQuantity(id, next, item.specialInstructions)}
                  onRemove={() => removeItem(id)}
                />
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          <Card className="mt-2">
            <Text variant="h3" className="mb-2">
              Price breakdown
            </Text>
            <FeeRow label="Subtotal" value={breakdown.subtotal} />
            <FeeRow label="Delivery" value={breakdown.deliveryFee} />
            <FeeRow label="Service" value={breakdown.serviceFee} />
            <Divider className="my-2" />
            <FeeRow label="Total" value={breakdown.total} strong />
            <Text variant="caption" tone="muted">
              Tip and any priority fee are added at checkout.
            </Text>
          </Card>
        }
      />

      <DockedBar>
        <Button size="lg" fullWidth onPress={() => router.push("/(customer)/checkout")}>
          <View className="flex-row items-center gap-2">
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              Go to checkout
            </Text>
            <Text
              variant="body-lg"
              className="font-jakarta-bold text-primary-foreground opacity-70"
            >
              ·
            </Text>
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              {formatPrice(breakdown.total)}
            </Text>
            <ArrowRight size={19} strokeWidth={2.6} color={color["primary-foreground"]} />
          </View>
        </Button>
      </DockedBar>
    </Screen>
  );
}
