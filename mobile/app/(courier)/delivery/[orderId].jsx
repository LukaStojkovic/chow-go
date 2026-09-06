import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { MapPin, Navigation, Phone, Store } from "lucide-react-native";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { toLatLng } from "@chowgo/shared/geo";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Map, MapMarker, toRegion } from "@/components/map/Map";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SwipeToConfirm } from "@/features/courier/SwipeToConfirm";
import {
  useCourierOrder,
  useMarkDelivered,
  useMarkInTransit,
  useMarkPickedUp,
  useReleaseOrder,
} from "@/hooks/Courier/useCourier";
import { useCourierLocationBroadcast } from "@/location/useCourierLocationBroadcast";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

// Each status has exactly one next step and one destination.
const STEPS = {
  assigned: { label: "Swipe when picked up", target: "restaurant" },
  picked_up: { label: "Swipe when on the way", target: "customer" },
  in_transit: { label: "Swipe when delivered", target: "customer" },
};

export default function ActiveDelivery() {
  const { orderId } = useLocalSearchParams();
  const { data, isLoading, isError, refetch } = useCourierOrder(orderId);
  const { color } = useTokens();

  const pickedUp = useMarkPickedUp();
  const inTransit = useMarkInTransit();
  const delivered = useMarkDelivered();
  const release = useReleaseOrder();
  const [busy, setBusy] = useState(false);

  // The customer is watching a map; the screen going dark must not stop it.
  useKeepAwake();
  useCourierLocationBroadcast(data?.status && STEPS[data.status] ? orderId : null);

  if (isLoading) {
    return (
      <Screen className="gap-4 p-5">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-24 w-full" />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen className="justify-center">
        <EmptyState title="Couldn't load this delivery" actionLabel="Retry" onAction={refetch} />
      </Screen>
    );
  }

  const order = toOrderView(data);
  const step = STEPS[data.status];
  const restaurant = toLatLng(data.restaurant?.location?.coordinates);
  const destination = toLatLng(data.deliveryAddressSnapshot?.location?.coordinates);
  const target = step?.target === "restaurant" ? restaurant : destination;

  async function advance() {
    setBusy(true);
    try {
      if (data.status === "assigned") await pickedUp.mutateAsync(orderId);
      else if (data.status === "picked_up") await inTransit.mutateAsync(orderId);
      else if (data.status === "in_transit") {
        await delivered.mutateAsync(orderId);
        toast.success("Delivered", { description: `Order #${order.number}` });
        router.replace("/(courier)/(tabs)");
        return;
      }
    } catch (error) {
      toast.error("Could not update the delivery", { description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  // Hands the leg off to whichever navigation app the courier actually uses.
  function navigate() {
    if (!target) return;
    const [lat, lng] = target;
    Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}`).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`),
    );
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="h-56 overflow-hidden">
        {target ? (
          <Map initialRegion={toRegion(target, 0.02)}>
            <MapMarker position={restaurant} title={data.restaurant?.name} />
            <MapMarker position={destination} title="Delivery address" />
          </Map>
        ) : null}
      </View>

      <ScrollView contentContainerClassName="gap-4 p-5">
        <View className="gap-1">
          <Text variant="caption" tone="muted">
            #{order.number}
          </Text>
          <Text variant="h2">{order.statusLabel}</Text>
        </View>

        <Card className="gap-3">
          <View className="flex-row items-start gap-3">
            <Store size={17} color={color["muted-foreground"]} style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text variant="label">{data.restaurant?.name}</Text>
              <Text variant="body-sm" tone="muted">
                {data.restaurant?.address?.street}, {data.restaurant?.address?.city}
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3">
            <MapPin size={17} color={color["muted-foreground"]} style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text variant="label">{data.customer?.name}</Text>
              <Text variant="body-sm" tone="muted">
                {data.deliveryAddressSnapshot?.fullAddress}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <Button variant="outline" size="sm" className="flex-1" onPress={navigate}>
              <View className="flex-row items-center gap-2">
                <Navigation size={14} color={color.foreground} />
                <Text variant="label">Navigate</Text>
              </View>
            </Button>
            {data.customer?.phoneNumber ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onPress={() => Linking.openURL(`tel:${data.customer.phoneNumber}`)}
              >
                <View className="flex-row items-center gap-2">
                  <Phone size={14} color={color.foreground} />
                  <Text variant="label">Call</Text>
                </View>
              </Button>
            ) : null}
          </View>
        </Card>

        <Card className="gap-2">
          <Text variant="label">Items</Text>
          {order.items.map((line) => (
            <Text key={line.id} variant="body-sm" tone="muted">
              {line.quantity} × {line.name}
            </Text>
          ))}
          <View className="h-px bg-border" />
          <View className="flex-row justify-between">
            <Text variant="label">
              {order.paymentMethod === "cash" ? "Collect from customer" : "Already paid"}
            </Text>
            <Text variant="price">
              {order.paymentMethod === "cash" ? formatPrice(order.pricing?.total ?? 0) : "—"}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            You earn {formatPrice(data.deliveryFee ?? 0)}
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

        {data.status === "assigned" ? (
          <Button
            variant="ghost"
            loading={release.isPending}
            onPress={async () => {
              try {
                await release.mutateAsync({ orderId, reason: "Cannot complete this delivery" });
                toast.info("Returned to the pool");
                router.replace("/(courier)/(tabs)");
              } catch (error) {
                toast.error("Could not release it", { description: errorMessage(error) });
              }
            }}
          >
            <Text variant="label" tone="destructive">
              Return to the pool
            </Text>
          </Button>
        ) : null}
      </ScrollView>

      {step ? (
        <View className="p-4">
          <SwipeToConfirm label={step.label} busy={busy} onConfirm={advance} />
        </View>
      ) : null}
    </Screen>
  );
}
