import { Pressable, View } from "react-native";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";

const TONES = { warning: "warning", info: "info", success: "success", destructive: "destructive" };

export function OrderCard({ order, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.number}, ${order.statusLabel}`}
      onPress={onPress}
      className="gap-2 rounded-md border border-border bg-card p-4 active:opacity-70"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="label" numberOfLines={1}>
            {order.restaurant?.name ?? "Restaurant"}
          </Text>
          <Text variant="caption" tone="muted">
            #{order.number} · {order.placedAtLabel}
          </Text>
        </View>
        <Text variant="price">{formatPrice(order.pricing?.total ?? 0)}</Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text variant="body-sm" tone={TONES[order.statusTone] ?? "muted"}>
          {order.statusLabel}
        </Text>
        <Text variant="caption" tone="muted">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </Text>
      </View>
    </Pressable>
  );
}
