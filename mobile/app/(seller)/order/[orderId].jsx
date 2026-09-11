import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { AlertTriangle } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { Card, Inset } from "@/components/ui/Card";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { shortStatus } from "@/features/orders/orderStatus";
import { RejectOrderPrompt } from "@/features/seller/RejectOrderPrompt";
import { useCancelRestaurantOrder } from "@/hooks/SellerOrders/useSellerOrders";
import { getRestaurantOrderById } from "@/services/apiRestaurantOrder";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

// The restaurant may pull an order until a courier has it.
const CANCELLABLE = ["confirmed", "preparing", "ready"];

export default function SellerOrderDetail() {
  const { orderId } = useLocalSearchParams();
  const cancel = useCancelRestaurantOrder();
  const [cancelling, setCancelling] = useState(false);
  const { color } = useTokens();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["restaurantOrder", orderId],
    queryFn: () => getRestaurantOrderById(orderId),
    enabled: Boolean(orderId),
  });

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Order" />
        <View className="gap-4 px-5">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ScreenHeader title="Order" />
        <EmptyState
          tone="danger"
          title="Couldn't load this order"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
      </Screen>
    );
  }

  const order = toOrderView(data);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={`#${order.number}`} subtitle={order.placedAtLabel} />

      <ScrollView contentContainerClassName="gap-3 px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Card className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="h3" numberOfLines={1}>
              {shortStatus(order)}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </Text>
          </View>
          <Text variant="price-lg">{formatPrice(order.pricing?.total ?? 0)}</Text>
        </Card>

        <Card className="gap-3">
          {order.items.map((line, index) => (
            <View key={line.id}>
              {index > 0 ? <Divider className="mb-3" /> : null}
              <View className="flex-row items-start gap-3">
                <View className="rounded-xs bg-primary-subtle px-2 py-1">
                  <Text variant="label-sm" tone="primary">
                    {line.quantity}×
                  </Text>
                </View>
                <Text variant="body-lg" className="flex-1" numberOfLines={2}>
                  {line.name}
                </Text>
                <Text variant="price">{formatPrice(line.lineTotal)}</Text>
              </View>
              {line.notes ? (
                <Inset tone="warning" className="mt-2 flex-row items-center gap-2 p-2.5">
                  <AlertTriangle size={13} color={color.warning} />
                  <Text variant="caption" className="flex-1 text-warning">
                    {line.notes}
                  </Text>
                </Inset>
              ) : null}
            </View>
          ))}

          <Divider />

          <View className="flex-row items-center justify-between">
            <Text variant="h3">Total</Text>
            <View className="flex-row items-center gap-2">
              <Badge tone="neutral" size="sm">
                {order.paymentMethodLabel}
              </Badge>
              <Text variant="price-lg">{formatPrice(order.pricing?.total ?? 0)}</Text>
            </View>
          </View>
        </Card>

        {data.customerNotes ? (
          <Card className="flex-row items-start gap-3">
            <View className="flex-1">
              <Text variant="caption" tone="muted">
                Note from the customer
              </Text>
              <Text variant="body" numberOfLines={4}>
                {data.customerNotes}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card className="gap-3">
          <View className="flex-row items-start gap-3">
            <View className="flex-1">
              <Text variant="caption" tone="muted">
                Delivering to
              </Text>
              <Text variant="body" numberOfLines={3}>
                {data.deliveryAddressSnapshot?.fullAddress ?? "—"}
              </Text>
            </View>
          </View>

          {order.courier ? (
            <>
              <Divider />
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text variant="caption" tone="muted">
                    Courier
                  </Text>
                  <Text variant="body" numberOfLines={1}>
                    {order.courier.name}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </Card>

        {CANCELLABLE.includes(order.status) ? (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            className="mt-2"
            onPress={() => setCancelling(true)}
          >
            <Text variant="label" tone="destructive">
              Cancel order
            </Text>
          </Button>
        ) : null}
      </ScrollView>

      <RejectOrderPrompt
        visible={cancelling}
        isPending={cancel.isPending}
        onCancel={() => setCancelling(false)}
        onConfirm={async (reason) => {
          try {
            await cancel.mutateAsync({ orderId, reason });
            setCancelling(false);
            toast.info("Order cancelled");
            router.back();
          } catch (error) {
            toast.error("Could not cancel", { description: errorMessage(error) });
          }
        }}
      />
    </Screen>
  );
}
