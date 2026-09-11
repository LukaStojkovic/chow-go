import { View } from "react-native";
import { formatPrice } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { STATUS_BADGE_TONE, shortStatus } from "@/features/orders/orderStatus";

// The one action the seller can take from here, per status. Anything beyond
// `ready` belongs to the courier, so the card stops offering buttons.
const NEXT_ACTION = {
  confirmed: { label: "Start preparing", status: "preparing" },
  preparing: { label: "Mark ready", status: "ready" },
};

/**
 * An order on the seller's board.
 *
 * The number is set in the price face because in a kitchen it is read across a
 * room, off a phone propped against a rail. Everything else is secondary to
 * "which ticket is this".
 */
export function SellerOrderCard({ order, onPress, onAdvance, onOpen, isBusy }) {
  const action = NEXT_ACTION[order.status];
  const needsAttention = order.status === "pending";

  return (
    <Card className="gap-3.5" elevation={needsAttention ? "raised" : "subtle"}>
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text variant="price-lg" numberOfLines={1}>
            #{order.number}
          </Text>
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {order.placedAtLabel}
          </Text>
        </View>

        <View className="shrink-0 items-end gap-1.5">
          <Text variant="price">{formatPrice(order.pricing?.total ?? 0)}</Text>
          <Badge tone={STATUS_BADGE_TONE[order.statusTone] ?? "neutral"} size="sm">
            {shortStatus(order)}
          </Badge>
        </View>
      </View>

      <Divider />

      <View className="flex-row gap-2.5">
        <Button variant="secondary" size="md" className="flex-1" onPress={onOpen}>
          Details
        </Button>

        {needsAttention ? (
          <Button size="md" className="flex-1" onPress={onPress}>
            Review
          </Button>
        ) : action ? (
          <Button
            size="md"
            className="flex-1"
            loading={isBusy}
            onPress={() => onAdvance(action.status)}
          >
            {action.label}
          </Button>
        ) : null}
      </View>
    </Card>
  );
}
