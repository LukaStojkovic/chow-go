import { useMemo, useRef, useState } from "react";
import { Linking, View } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { ArrowLeft, Banknote, Navigation, Phone } from "lucide-react-native";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { toLatLng } from "@chowgo/shared/geo";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";

import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { DeliveryNavigationMap } from "@/features/courier/DeliveryNavigationMap";
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
import { radius } from "@/theme/tokens";
import { useTokens } from "@/theme/useTokens";

/**
 * How much of the screen the sheet takes.
 *
 * The lowest stop keeps the order number, the earnings and the swipe control
 * on screen and hands the rest to the map - which is the whole reason a
 * courier opens this screen while moving. The details are still one drag away.
 */
const SNAP_POINTS = ["28%", "58%", "92%"];

// Clearance for the docked swipe control, which floats over the sheet.
const ACTION_BAR_H = 104;

// Each status has exactly one next step and one destination.
const STEPS = {
  assigned: { label: "Swipe when picked up", target: "restaurant" },
  picked_up: { label: "Swipe when on the way", target: "customer" },
  in_transit: { label: "Swipe when delivered", target: "customer" },
};

export default function ActiveDelivery() {
  const { orderId } = useLocalSearchParams();
  const { data, isLoading, isError, refetch } = useCourierOrder(orderId);
  const { color, elevation, scheme } = useTokens();
  const insets = useSafeAreaInsets();

  const pickedUp = useMarkPickedUp();
  const inTransit = useMarkInTransit();
  const delivered = useMarkDelivered();
  const release = useReleaseOrder();
  const [busy, setBusy] = useState(false);
  const sheet = useRef(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);

  // The customer is watching a map; the screen going dark must not stop it.
  useKeepAwake();
  // One GPS watch: the customer follows it over the socket, the map below
  // draws from the same fix.
  const fix = useCourierLocationBroadcast(data?.status && STEPS[data.status] ? orderId : null);

  if (isLoading) {
    return (
      <Screen>
        <ScreenHeader title="Delivery" />
        <View className="gap-4 px-5">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <ScreenHeader title="Delivery" />
        <EmptyState
          tone="danger"
          title="Couldn't load this delivery"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={refetch}
        />
      </Screen>
    );
  }

  const order = toOrderView(data);
  const step = STEPS[data.status];
  const restaurant = toLatLng(data.restaurant?.location?.coordinates);
  const destination = toLatLng(data.deliveryAddressSnapshot?.location?.coordinates);
  const target = step?.target === "restaurant" ? restaurant : destination;
  const destinationLabel =
    step?.target === "restaurant"
      ? (data.restaurant?.name ?? "Restaurant")
      : (data.deliveryAddressSnapshot?.fullAddress ?? data.customer?.name ?? "Customer");
  const collectsCash = order.paymentMethod === "cash";

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
    <View className="flex-1 bg-background">
      {/* The map is the screen. Everything else floats over it, and the sheet
          below can be dragged down to hand almost all of it back. */}
      <DeliveryNavigationMap
        status={data.status}
        restaurant={restaurant}
        destination={destination}
        destinationLabel={destinationLabel}
        courier={fix.position}
        isTracking={fix.isTracking}
        isDenied={fix.isDenied}
        topOffset={insets.top + 58}
      />

      <View pointerEvents="box-none" style={{ top: insets.top + 6 }} className="absolute left-5">
        <IconButton
          icon={ArrowLeft}
          variant="surface"
          label="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(courier)"))}
          style={elevation.raised[scheme]}
        />
      </View>

      <BottomSheet
        ref={sheet}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        topInset={insets.top}
        backgroundStyle={{
          backgroundColor: color.card,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        handleIndicatorStyle={{ backgroundColor: color["muted-foreground"], width: 44 }}
        style={elevation.overlay[scheme]}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            gap: 12,
            paddingHorizontal: 20,
            paddingBottom: ACTION_BAR_H + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h1" numberOfLines={2}>
                {order.statusLabel}
              </Text>
              <Text variant="caption" tone="muted">
                #{order.number}
              </Text>
            </View>
            <Badge tone="mint">{`${formatPrice(data.deliveryFee ?? 0)} earned`}</Badge>
          </View>

          {/* The route, as two stops. The one you are heading to now is filled
                green; the one you are done with sits quiet. */}
          <Card className="gap-3">
            <View className="flex-row items-start gap-3">
              <View className="flex-1">
                <Text variant="caption" tone="muted">
                  Collect from
                </Text>
                <Text variant="h3" numberOfLines={1}>
                  {data.restaurant?.name}
                </Text>
                <Text variant="body-sm" tone="muted" numberOfLines={2}>
                  {data.restaurant?.address?.street}, {data.restaurant?.address?.city}
                </Text>
              </View>
            </View>

            <Divider />

            <View className="flex-row items-start gap-3">
              <View className="flex-1">
                <Text variant="caption" tone="muted">
                  Deliver to
                </Text>
                <Text variant="h3" numberOfLines={1}>
                  {data.customer?.name}
                </Text>
                <Text variant="body-sm" tone="muted" numberOfLines={2}>
                  {data.deliveryAddressSnapshot?.fullAddress}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2.5">
              <Button variant="secondary" size="md" className="flex-1" onPress={navigate}>
                <View className="flex-row items-center gap-2">
                  <Navigation size={15} color={color.foreground} />
                  <Text variant="label">Navigate</Text>
                </View>
              </Button>
              {data.customer?.phoneNumber ? (
                <Button
                  variant="mint"
                  size="md"
                  className="flex-1"
                  onPress={() => Linking.openURL(`tel:${data.customer.phoneNumber}`)}
                >
                  <View className="flex-row items-center gap-2">
                    <Phone size={15} color={color.primary} />
                    <Text variant="label" tone="primary">
                      Call
                    </Text>
                  </View>
                </Button>
              ) : null}
            </View>
          </Card>

          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <Text variant="h3" className="flex-1">
                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </Text>
            </View>

            {order.items.map((line) => (
              <View key={line.id} className="flex-row items-start gap-3">
                <View className="rounded-xs bg-muted px-2 py-1">
                  <Text variant="label-sm" tone="muted">
                    {line.quantity}×
                  </Text>
                </View>
                <Text variant="body" className="flex-1" numberOfLines={2}>
                  {line.name}
                </Text>
              </View>
            ))}

            <Divider />

            {/* Cash is the one thing on this screen with money changing hands, so
                  it gets a tinted block rather than a row of grey text. */}
            <Inset tone={collectsCash ? "citrus" : "mint"} className="flex-row items-center gap-3">
              <Banknote size={18} color={collectsCash ? color.tertiary : color.primary} />
              <View className="flex-1">
                <Text variant="caption" tone={collectsCash ? "tertiary" : "primary"}>
                  {collectsCash ? "Collect from the customer" : "Already paid"}
                </Text>
                {collectsCash ? (
                  <Text variant="price-lg" tone="tertiary">
                    {formatPrice(order.pricing?.total ?? 0)}
                  </Text>
                ) : (
                  <Text variant="body-sm" tone="muted">
                    Nothing to collect on the doorstep
                  </Text>
                )}
              </View>
            </Inset>
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

          {data.status === "assigned" ? (
            <Button
              variant="ghost"
              size="lg"
              fullWidth
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
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Docked rather than living in the sheet: the one control that must be
          reachable at any drag position, including with the sheet pushed all
          the way down to read the map. */}
      {step ? (
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0">
          <DockedBar>
            <SwipeToConfirm label={step.label} busy={busy} onConfirm={advance} />
          </DockedBar>
        </View>
      ) : null}
    </View>
  );
}
