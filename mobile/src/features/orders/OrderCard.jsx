import { Pressable, View } from "react-native";
import { ChevronRight, RotateCcw } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { STATUS_BADGE_TONE, shortStatus } from "./orderStatus";
import { useTokens } from "@/theme/useTokens";

/**
 * One order in the history list.
 *
 * The restaurant name is what you scan for, so it leads. The status is a short
 * pill rather than the adapter's full sentence, and the total sits opposite it
 * where the eye can run down a column of them.
 */
export function OrderCard({ order, onPress, onReorder, isReordering }) {
  const { color, elevation, scheme } = useTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.number}, ${order.statusLabel}`}
      onPress={onPress}
      style={elevation.subtle[scheme]}
      className="gap-3 rounded-lg bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text variant="h3" numberOfLines={1}>
            {order.restaurant?.name ?? "Restaurant"}
          </Text>
          <Text variant="body-sm" tone="muted" numberOfLines={1}>
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"} · {order.placedAtLabel}
          </Text>
        </View>

        <View className="shrink-0 flex-row items-center gap-2">
          <Text variant="price">{formatPrice(order.pricing?.total ?? 0)}</Text>
          <ChevronRight size={17} color={color["muted-foreground"]} />
        </View>
      </View>

      <Badge tone={STATUS_BADGE_TONE[order.statusTone] ?? "neutral"} size="sm">
        {shortStatus(order)}
      </Badge>

      {onReorder ? (
        <>
          <Divider />
          <Button variant="secondary" size="md" loading={isReordering} onPress={onReorder}>
            <View className="flex-row items-center gap-2">
              <RotateCcw size={15} strokeWidth={2.2} color={color.foreground} />
              <Text variant="label">Order again</Text>
            </View>
          </Button>
        </>
      ) : null}
    </Pressable>
  );
}
