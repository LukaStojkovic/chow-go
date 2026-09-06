import { ScrollView, View } from "react-native";
import { Phone } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { OrderStatusTimeline } from "@/features/orders/OrderStatusTimeline";
import { useCancelOrder, useOrder } from "@/hooks/Orders/useOrders";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const TONES = { warning: "warning", info: "info", success: "success", destructive: "destructive" };

export default function OrderTracking() {
  const { orderId } = useLocalSearchParams();
  const { data, isLoading, isError, refetch } = useOrder(orderId);
  const cancel = useCancelOrder(orderId);
  const { color } = useTokens();

  if (isLoading) {
    return (
      <Screen className="gap-4 p-5">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen className="justify-center">
        <EmptyState title="Couldn't load this order" actionLabel="Retry" onAction={refetch} />
      </Screen>
    );
  }

  const order = toOrderView(data);

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-5 p-5 pb-8">
        <View className="gap-1">
          <Text variant="h1">{order.statusLabel}</Text>
          <Text variant="body" tone="muted">
            {order.statusDescription}
          </Text>
          <Text variant="caption" tone="muted">
            Order #{order.number} · {order.restaurant?.name}
          </Text>
        </View>

        {order.lifecycle === "cancelled" ? (
          <Card className="border-destructive">
            <Text variant="body-sm" tone="destructive">
              This order is no longer active.
            </Text>
          </Card>
        ) : (
          <Card>
            <OrderStatusTimeline status={order.status} />
          </Card>
        )}

        {order.courier ? (
          <Card className="flex-row items-center gap-3">
            <View className="flex-1 gap-0.5">
              <Text variant="caption" tone="muted">
                Your courier
              </Text>
              <Text variant="label">{order.courier.name}</Text>
              {order.courier.vehicle ? (
                <Text variant="caption" tone="muted">
                  {order.courier.vehicle}
                </Text>
              ) : null}
            </View>
            {order.courier.phone ? <Phone size={18} color={color["muted-foreground"]} /> : null}
          </Card>
        ) : null}

        <Card className="gap-2">
          <Text variant="label">Items</Text>
          {order.items.map((line) => (
            <View key={line.id} className="flex-row justify-between gap-3">
              <Text variant="body-sm" tone="muted" className="flex-1" numberOfLines={2}>
                {line.quantity} × {line.name}
              </Text>
              <Text variant="body-sm">{formatPrice(line.lineTotal)}</Text>
            </View>
          ))}
          <View className="h-px bg-border" />
          <View className="flex-row justify-between">
            <Text variant="label">Total</Text>
            <Text variant="price">{formatPrice(order.pricing?.total ?? 0)}</Text>
          </View>
          <Text variant="caption" tone="muted">
            {order.paymentMethodLabel}
          </Text>
        </Card>

        {order.canCancel ? (
          <Button
            variant="outline"
            loading={cancel.isPending}
            onPress={async () => {
              try {
                await cancel.mutateAsync("Changed my mind");
                toast.success("Order cancelled");
              } catch (error) {
                toast.error("Could not cancel", { description: errorMessage(error) });
              }
            }}
          >
            Cancel order
          </Button>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
