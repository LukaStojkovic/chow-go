import { View } from "react-native";
import { formatPrice } from "@chowgo/shared/format";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

// The one action the seller can take from here, per status. Anything beyond
// `ready` belongs to the courier, so the card stops offering buttons.
const NEXT_ACTION = {
  confirmed: { label: "Start preparing", status: "preparing" },
  preparing: { label: "Mark ready", status: "ready" },
};

const TONES = { warning: "warning", info: "info", success: "success", destructive: "destructive" };

export function SellerOrderCard({ order, onPress, onAdvance, onOpen, isBusy }) {
  const action = NEXT_ACTION[order.status];

  return (
    <View className="gap-3 rounded-md border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="label">#{order.number}</Text>
          <Text variant="caption" tone="muted">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {order.placedAtLabel}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text variant="price">{formatPrice(order.pricing?.total ?? 0)}</Text>
          <Text variant="caption" tone={TONES[order.statusTone] ?? "muted"}>
            {order.statusLabel}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Button variant="outline" size="sm" className="flex-1" onPress={onOpen}>
          Details
        </Button>
        {order.status === "pending" ? (
          <Button size="sm" className="flex-1" onPress={onPress}>
            Review
          </Button>
        ) : action ? (
          <Button
            size="sm"
            className="flex-1"
            loading={isBusy}
            onPress={() => onAdvance(action.status)}
          >
            {action.label}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
