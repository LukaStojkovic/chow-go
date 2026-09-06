import { Pressable, View } from "react-native";
import { RotateCcw } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@chowgo/shared/format";
import { Text } from "@/components/ui/Text";

const TONES = { warning: "warning", info: "info", success: "success", destructive: "destructive" };

export function OrderCard({ order, onPress, onReorder, isReordering }) {
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

      {onReorder ? (
        <Button
          variant="outline"
          size="sm"
          loading={isReordering}
          onPress={onReorder}
          className="mt-1"
        >
          <View className="flex-row items-center gap-2">
            <RotateCcw size={14} className="text-foreground" />
            <Text variant="body-sm">Order again</Text>
          </View>
        </Button>
      ) : null}
    </Pressable>
  );
}
