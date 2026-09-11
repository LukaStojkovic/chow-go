import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { CircleHelp, MapPin, MessageSquare, NotebookPen, Phone, Star } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";

import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { OrderStatusTimeline } from "@/features/orders/OrderStatusTimeline";
import { OrderTrackingMap } from "@/features/orders/OrderTrackingMap";
import { CancelOrderPrompt } from "@/features/orders/CancelOrderPrompt";
import { useCancelOrder, useOrder } from "@/hooks/Orders/useOrders";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

// The adapter's status tones, mapped onto the badge's own vocabulary.
const BADGE_TONE = {
  warning: "warning",
  info: "info",
  primary: "mint",
  success: "mint",
  destructive: "danger",
};

export default function OrderTracking() {
  const { orderId } = useLocalSearchParams();
  const { data, isLoading, isError, refetch } = useOrder(orderId);
  const cancel = useCancelOrder(orderId);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { color } = useTokens();

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Order tracking" />
        <View className="gap-4 px-5">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ScreenHeader title="Order tracking" />
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
  const cancelled = order.lifecycle === "cancelled";

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        title="Order tracking"
        subtitle={`#${order.number}`}
        right={
          <IconButton
            icon={CircleHelp}
            variant="muted"
            label="Get help with this order"
            onPress={() => toast.info("Support", { description: "Reach us at help@chowgo.app" })}
          />
        }
      />

      <ScrollView contentContainerClassName="gap-3 px-5 pb-8" showsVerticalScrollIndicator={false}>
        {/* Status first, and large. On this screen the only question is "where
             is my food", so the answer gets the top of the page and the biggest
             type in the app. */}
        <Card className="gap-4">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
              {!order.isTerminal ? <StatusDot /> : null}
              <Badge tone={BADGE_TONE[order.statusTone] ?? "neutral"}>{order.statusLabel}</Badge>
            </View>
            <Text variant="caption" tone="muted" numberOfLines={1} className="shrink-0">
              {order.placedAtLabel}
            </Text>
          </View>

          <Text variant="body" tone="muted">
            {order.statusDescription}
          </Text>

          {cancelled ? (
            <Inset tone="danger" className="flex-row items-center gap-3">
              <Text variant="body-sm" className="flex-1 text-destructive">
                {order.cancellationReason ?? "This order is no longer active."}
              </Text>
            </Inset>
          ) : (
            <OrderStatusTimeline steps={order.steps} />
          )}
        </Card>

        {/* Renders itself away unless a courier is assigned and moving. */}
        <OrderTrackingMap order={data} />

        {order.courier ? (
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                {order.courier.avatar ? (
                  <Image
                    source={order.courier.avatar}
                    style={{ flex: 1 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : null}
              </View>

              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text variant="h3" numberOfLines={1}>
                    {order.courier.name}
                  </Text>
                  {order.courier.rating ? (
                    <View className="flex-row items-center gap-1">
                      <Star size={12} color={color.rating} fill={color.rating} />
                      <Text variant="label-sm">{order.courier.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="body-sm" tone="muted" numberOfLines={1}>
                  {order.courier.vehicle
                    ? `Delivering by ${order.courier.vehicle}`
                    : "Your courier"}
                </Text>
              </View>

              {order.courier.phone ? (
                <View className="flex-row gap-2">
                  <IconButton
                    icon={MessageSquare}
                    variant="mint"
                    size={44}
                    label="Message your courier"
                    onPress={() => Linking.openURL(`sms:${order.courier.phone}`)}
                  />

                  <IconButton
                    icon={Phone}
                    variant="primary"
                    size={44}
                    label="Call your courier"
                    onPress={() => Linking.openURL(`tel:${order.courier.phone}`)}
                  />
                </View>
              ) : null}
            </View>

            {order.deliveryNotes ? (
              <Inset className="flex-row items-center gap-3">
                <NotebookPen size={16} color={color["muted-foreground"]} />
                <Text variant="body-sm" tone="muted" className="flex-1" numberOfLines={2}>
                  {order.deliveryNotes}
                </Text>
              </Inset>
            ) : null}
          </Card>
        ) : null}

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3" numberOfLines={1}>
                {order.restaurant?.name ?? "Restaurant"}
              </Text>
              <Text variant="body-sm" tone="muted">
                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
            <Badge tone="neutral">{order.paymentMethodLabel}</Badge>
          </View>

          <Divider />

          {order.items.map((line) => (
            <View key={line.id} className="flex-row items-start gap-3">
              <View className="rounded-xs bg-muted px-2 py-1">
                <Text variant="label-sm" tone="muted">
                  {line.quantity}×
                </Text>
              </View>
              <View className="flex-1">
                <Text variant="body" numberOfLines={2}>
                  {line.name}
                </Text>
                {line.notes ? (
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {line.notes}
                  </Text>
                ) : null}
              </View>
              <Text variant="price">{formatPrice(line.lineTotal)}</Text>
            </View>
          ))}

          <Divider />

          <View className="flex-row items-end justify-between">
            <Text variant="h3">Total</Text>
            <Text variant="price-lg">{formatPrice(order.pricing?.total ?? 0)}</Text>
          </View>

          {order.deliveryAddress ? (
            <Inset className="flex-row items-start gap-3">
              <MapPin size={16} color={color.primary} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text variant="caption" tone="muted">
                  Delivering to
                </Text>
                <Text variant="body-sm" numberOfLines={3}>
                  {order.deliveryAddress}
                </Text>
              </View>
            </Inset>
          ) : null}
        </Card>

        <View className="gap-2.5 pt-1">
          {order.canRate ? (
            <Button
              size="lg"
              fullWidth
              onPress={() => router.push(`/(customer)/order/${orderId}/rate`)}
            >
              Rate your order
            </Button>
          ) : null}

          {order.canCancel ? (
            <Button size="lg" variant="outline" fullWidth onPress={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          ) : null}
        </View>
      </ScrollView>

      <CancelOrderPrompt
        visible={cancelOpen}
        isPending={cancel.isPending}
        onCancel={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          try {
            await cancel.mutateAsync(reason);
            setCancelOpen(false);
            toast.success("Order cancelled");
          } catch (error) {
            toast.error("Could not cancel", { description: errorMessage(error) });
          }
        }}
      />
    </Screen>
  );
}
