import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { RejectOrderPrompt } from "@/features/seller/RejectOrderPrompt";
import { useCancelRestaurantOrder } from "@/hooks/SellerOrders/useSellerOrders";
import { getRestaurantOrderById } from "@/services/apiRestaurantOrder";
import { toast } from "@/store/useToastStore";

// The restaurant may pull an order until a courier has it.
const CANCELLABLE = ["confirmed", "preparing", "ready"];

export default function SellerOrderDetail() {
  const { orderId } = useLocalSearchParams();
  const cancel = useCancelRestaurantOrder();
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["restaurantOrder", orderId],
    queryFn: () => getRestaurantOrderById(orderId),
    enabled: Boolean(orderId),
  });

  if (isLoading) {
    return (
      <Screen className="gap-4 p-5">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
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
          <Text variant="h1">#{order.number}</Text>
          <Text variant="body" tone="muted">
            {order.statusLabel} · {order.placedAtLabel}
          </Text>
        </View>

        <Card className="gap-2">
          <Text variant="label">Items</Text>
          {order.items.map((line) => (
            <View key={line.id} className="gap-0.5">
              <View className="flex-row justify-between gap-3">
                <Text variant="body" className="flex-1">
                  {line.quantity} × {line.name}
                </Text>
                <Text variant="body-sm" tone="muted">
                  {formatPrice(line.lineTotal)}
                </Text>
              </View>
              {line.notes ? (
                <Text variant="caption" tone="warning">
                  {line.notes}
                </Text>
              ) : null}
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

        {data.customerNotes ? (
          <Card>
            <Text variant="label">Note from the customer</Text>
            <Text variant="body-sm" tone="muted">
              {data.customerNotes}
            </Text>
          </Card>
        ) : null}

        <Card className="gap-1">
          <Text variant="label">Delivering to</Text>
          <Text variant="body-sm" tone="muted">
            {data.deliveryAddressSnapshot?.fullAddress ?? "—"}
          </Text>
          {order.courier ? (
            <Text variant="caption" tone="muted">
              Courier: {order.courier.name}
            </Text>
          ) : null}
        </Card>

        {CANCELLABLE.includes(order.status) ? (
          <Button variant="outline" onPress={() => setCancelling(true)}>
            Cancel order
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
