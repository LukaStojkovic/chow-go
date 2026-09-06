import { Pressable, View } from "react-native";
import { router, usePathname } from "expo-router";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";

// Persistent bar rather than a pushed route: the basket stays one thumb-reach
// away while browsing, which is what a pushed screen cannot do.
export function BasketMiniBar() {
  const { items, totalPrice, restaurant } = useCartStore();
  const pathname = usePathname();

  const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  // Hidden where it would be noise or duplicate the screen's own CTA.
  const hidden = count === 0 || pathname.startsWith("/basket") || pathname.startsWith("/checkout");
  if (hidden) return null;

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-2" pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View basket, ${count} items, ${formatPrice(totalPrice)}`}
        onPress={() => router.push("/(customer)/basket")}
        className="flex-row items-center gap-3 rounded-md bg-primary px-4 py-3 shadow-lg active:bg-primary-hover"
      >
        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-primary-foreground px-1.5">
          <Text
            variant="caption"
            className="text-primary"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {count}
          </Text>
        </View>
        <Text variant="label" className="flex-1 text-primary-foreground" numberOfLines={1}>
          {restaurant?.name ?? "View basket"}
        </Text>
        <Text variant="price" className="text-primary-foreground">
          {formatPrice(totalPrice)}
        </Text>
      </Pressable>
    </View>
  );
}
